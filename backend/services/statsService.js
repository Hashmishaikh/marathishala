const Series = require('../models/Series');
const Match = require('../models/Match');
const Player = require('../models/Player');
const Delivery = require('../models/Delivery');

/**
 * Convert overs representation (e.g. 9.4) to actual decimal overs (e.g. 9 + 4/6 = 9.666)
 */
function oversToDecimal(overs) {
  if (!overs) return 0;
  const parts = overs.toString().split('.');
  const completedOvers = parseInt(parts[0], 10) || 0;
  const remainingBalls = parseInt(parts[1], 10) || 0;
  return completedOvers + (remainingBalls / 6);
}

/**
 * Recalculate Points Table & NRR for a Series
 */
async function recalculateSeriesPointsTable(seriesId) {
  const series = await Series.findById(seriesId);
  if (!series) throw new Error('Series not found');

  const matches = await Match.find({ 
    seriesId, 
    status: 'Completed' 
  }).populate('teamA.teamId teamB.teamId');

  const statsMap = {};

  // Initialize for all participating teams
  series.teams.forEach(tId => {
    const teamKey = tId.toString();
    statsMap[teamKey] = {
      team: tId,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
      netRunRate: 0.0
    };
  });

  for (const match of matches) {
    if (match.innings.length < 2) continue;

    const teamAId = match.teamA.teamId._id ? match.teamA.teamId._id.toString() : match.teamA.teamId.toString();
    const teamBId = match.teamB.teamId._id ? match.teamB.teamId._id.toString() : match.teamB.teamId.toString();

    if (!statsMap[teamAId]) {
      statsMap[teamAId] = {
        team: match.teamA.teamId,
        played: 0, won: 0, lost: 0, tied: 0, points: 0,
        runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, netRunRate: 0.0
      };
    }
    if (!statsMap[teamBId]) {
      statsMap[teamBId] = {
        team: match.teamB.teamId,
        played: 0, won: 0, lost: 0, tied: 0, points: 0,
        runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, netRunRate: 0.0
      };
    }

    statsMap[teamAId].played += 1;
    statsMap[teamBId].played += 1;

    // Check result
    if (match.result && match.result.winType === 'tie') {
      statsMap[teamAId].tied += 1;
      statsMap[teamBId].tied += 1;
      statsMap[teamAId].points += 1;
      statsMap[teamBId].points += 1;
    } else if (match.result && match.result.winner) {
      const winnerId = match.result.winner.toString();
      if (winnerId === teamAId) {
        statsMap[teamAId].won += 1;
        statsMap[teamAId].points += 2;
        statsMap[teamBId].lost += 1;
      } else if (winnerId === teamBId) {
        statsMap[teamBId].won += 1;
        statsMap[teamBId].points += 2;
        statsMap[teamAId].lost += 1;
      }
    }

    // Accumulate runs & overs for NRR
    const inn1 = match.innings[0];
    const inn2 = match.innings[1];

    const team1BatId = inn1.battingTeam.toString();
    const team2BatId = inn2.battingTeam.toString();

    // In cricket NRR: If team is all-out, they are considered to have faced full allotted overs
    const inn1OversAllotted = (inn1.wickets >= inn1.maxWicketsForInnings) 
      ? match.totalOvers 
      : oversToDecimal(inn1.overs);

    const inn2OversAllotted = (inn2.wickets >= inn2.maxWicketsForInnings && match.result?.winType !== 'wickets') 
      ? match.totalOvers 
      : oversToDecimal(inn2.overs);

    if (statsMap[team1BatId]) {
      statsMap[team1BatId].runsScored += inn1.totalRuns;
      statsMap[team1BatId].oversFaced += inn1OversAllotted;
      statsMap[team1BatId].runsConceded += inn2.totalRuns;
      statsMap[team1BatId].oversBowled += inn2OversAllotted;
    }

    if (statsMap[team2BatId]) {
      statsMap[team2BatId].runsScored += inn2.totalRuns;
      statsMap[team2BatId].oversFaced += inn2OversAllotted;
      statsMap[team2BatId].runsConceded += inn1.totalRuns;
      statsMap[team2BatId].oversBowled += inn1OversAllotted;
    }
  }

  // Calculate NRR and build sorted points table
  const updatedPointsTable = Object.values(statsMap).map(entry => {
    const forRate = entry.oversFaced > 0 ? (entry.runsScored / entry.oversFaced) : 0;
    const againstRate = entry.oversBowled > 0 ? (entry.runsConceded / entry.oversBowled) : 0;
    entry.netRunRate = parseFloat((forRate - againstRate).toFixed(3));
    return entry;
  });

  // Sort by points desc, NRR desc, won desc
  updatedPointsTable.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
    return b.won - a.won;
  });

  series.pointsTable = updatedPointsTable;
  await series.save();

  return Series.findById(seriesId).populate('teams pointsTable.team');
}

function getPlayerId(entity) {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;
  if (typeof entity === 'object') {
    if (entity._id) return entity._id.toString();
    if (entity.id) return entity.id.toString();
  }
  return String(entity);
}

/**
 * Get Tournament Leaderboards (Orange Cap & Purple Cap)
 */
async function getSeriesLeaderboards(seriesId) {
  const matches = await Match.find({ seriesId }).select('innings');

  const battingAggregation = {};
  const bowlingAggregation = {};

  for (const match of matches) {
    for (const inn of match.innings || []) {
      // Aggregate batsmen stats
      for (const b of inn.batsmenStats || []) {
        const pId = getPlayerId(b.player);
        if (!pId) continue;
        if (!battingAggregation[pId]) {
          battingAggregation[pId] = {
            playerId: pId,
            innings: 0,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            highestScore: 0,
            fifties: 0,
            hundreds: 0,
            notOuts: 0
          };
        }
        battingAggregation[pId].innings += 1;
        battingAggregation[pId].runs += (b.runs || 0);
        battingAggregation[pId].balls += (b.balls || 0);
        battingAggregation[pId].fours += (b.fours || 0);
        battingAggregation[pId].sixes += (b.sixes || 0);
        if (b.runs > battingAggregation[pId].highestScore) {
          battingAggregation[pId].highestScore = b.runs;
        }
        if (b.runs >= 100) battingAggregation[pId].hundreds += 1;
        else if (b.runs >= 50) battingAggregation[pId].fifties += 1;
        if (!b.isOut) battingAggregation[pId].notOuts += 1;
      }

      // Aggregate bowler stats
      for (const bw of inn.bowlerStats || []) {
        const pId = getPlayerId(bw.player);
        if (!pId) continue;
        if (!bowlingAggregation[pId]) {
          bowlingAggregation[pId] = {
            playerId: pId,
            overs: 0,
            ballsBowled: 0,
            maidens: 0,
            runsConceded: 0,
            wickets: 0,
            bestBowling: { wickets: 0, runs: 9999 }
          };
        }
        bowlingAggregation[pId].ballsBowled += (bw.ballsBowled || 0);
        bowlingAggregation[pId].maidens += (bw.maidens || 0);
        bowlingAggregation[pId].runsConceded += (bw.runsConceded || 0);
        bowlingAggregation[pId].wickets += (bw.wickets || 0);

        if (
          bw.wickets > bowlingAggregation[pId].bestBowling.wickets ||
          (bw.wickets === bowlingAggregation[pId].bestBowling.wickets && bw.runsConceded < bowlingAggregation[pId].bestBowling.runs)
        ) {
          bowlingAggregation[pId].bestBowling = { wickets: bw.wickets, runs: bw.runsConceded };
        }
      }
    }
  }

  // Populate players
  const playerIds = [
    ...new Set([...Object.keys(battingAggregation), ...Object.keys(bowlingAggregation)])
  ].filter(Boolean);

  const players = await Player.find({ _id: { $in: playerIds } });
  const playerMap = {};
  players.forEach(p => { playerMap[p._id.toString()] = p; });

  // Compute Orange Cap Leaderboard (Top run-scorers)
  const orangeCapList = Object.values(battingAggregation).map(b => {
    const outs = b.innings - b.notOuts;
    const average = outs > 0 ? parseFloat((b.runs / outs).toFixed(2)) : b.runs;
    const strikeRate = b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(2)) : 0.0;
    const foundPlayer = playerMap[b.playerId];
    return {
      player: foundPlayer || { _id: b.playerId, name: 'Player' },
      ...b,
      average,
      strikeRate
    };
  }).sort((a, b) => b.runs - a.runs || b.strikeRate - a.strikeRate);

  // Compute Purple Cap Leaderboard (Top wicket-takers)
  const purpleCapList = Object.values(bowlingAggregation).map(bw => {
    const oversDec = bw.ballsBowled / 6;
    const economy = oversDec > 0 ? parseFloat((bw.runsConceded / oversDec).toFixed(2)) : 0.0;
    const oversFormatted = `${Math.floor(bw.ballsBowled / 6)}.${bw.ballsBowled % 6}`;
    const foundPlayer = playerMap[bw.playerId];
    return {
      player: foundPlayer || { _id: bw.playerId, name: 'Player' },
      ...bw,
      overs: oversFormatted,
      economy
    };
  }).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

  return {
    orangeCap: orangeCapList[0] || null,
    purpleCap: purpleCapList[0] || null,
    topBatsmen: orangeCapList.slice(0, 10),
    topBowlers: purpleCapList.slice(0, 10)
  };
}

/**
 * Sync lifetime career statistics for all players
 */
async function syncGlobalPlayerStats() {
  const matches = await Match.find({ status: 'Completed' });
  const playerStatsMap = {};

  for (const match of matches) {
    const matchPlayerIds = new Set();

    // Collect all players who participated
    (match.teamA?.players || []).forEach(p => {
      const id = getPlayerId(p);
      if (id) matchPlayerIds.add(id);
    });
    (match.teamB?.players || []).forEach(p => {
      const id = getPlayerId(p);
      if (id) matchPlayerIds.add(id);
    });

    matchPlayerIds.forEach(pId => {
      if (!playerStatsMap[pId]) {
        playerStatsMap[pId] = {
          matches: 0,
          innings: 0,
          runs: 0,
          ballsFaced: 0,
          highestScore: 0,
          fifties: 0,
          hundreds: 0,
          notOuts: 0,
          wickets: 0,
          ballsBowled: 0,
          runsConceded: 0,
          bestBowling: { wickets: 0, runs: 0 },
          catches: 0,
          stumpings: 0,
          runOuts: 0
        };
      }
      playerStatsMap[pId].matches += 1;
    });

    // Process each innings
    for (const inn of match.innings || []) {
      for (const b of inn.batsmenStats || []) {
        const pId = getPlayerId(b.player);
        if (!pId || !playerStatsMap[pId]) continue;
        playerStatsMap[pId].innings += 1;
        playerStatsMap[pId].runs += (b.runs || 0);
        playerStatsMap[pId].ballsFaced += (b.balls || 0);
        if (b.runs > playerStatsMap[pId].highestScore) {
          playerStatsMap[pId].highestScore = b.runs;
        }
        if (b.runs >= 100) playerStatsMap[pId].hundreds += 1;
        else if (b.runs >= 50) playerStatsMap[pId].fifties += 1;
        if (!b.isOut) playerStatsMap[pId].notOuts += 1;
      }

      for (const bw of inn.bowlerStats || []) {
        const pId = getPlayerId(bw.player);
        if (!pId || !playerStatsMap[pId]) continue;
        playerStatsMap[pId].ballsBowled += (bw.ballsBowled || 0);
        playerStatsMap[pId].runsConceded += (bw.runsConceded || 0);
        playerStatsMap[pId].wickets += (bw.wickets || 0);

        if (
          bw.wickets > playerStatsMap[pId].bestBowling.wickets ||
          (bw.wickets === playerStatsMap[pId].bestBowling.wickets && bw.runsConceded < (playerStatsMap[pId].bestBowling.runs || 999))
        ) {
          playerStatsMap[pId].bestBowling = { wickets: bw.wickets, runs: bw.runsConceded };
        }
      }
    }
  }

  // Bulk update player collection
  const updatePromises = Object.keys(playerStatsMap).map(async (pId) => {
    return Player.findByIdAndUpdate(pId, { stats: playerStatsMap[pId] });
  });

  await Promise.all(updatePromises);
}

/**
 * Get comprehensive series summary with scorelines, match lists, and rankings
 */
async function getSeriesSummary(seriesId) {
  const series = await Series.findById(seriesId)
    .populate('teams')
    .populate('pointsTable.team');
  if (!series) throw new Error('Series not found');

  const matches = await Match.find({ seriesId })
    .populate('teamA.teamId teamB.teamId teamA.players teamB.players result.winner')
    .sort({ createdAt: 1 });

  // Recalculate points table and leaderboards
  const updatedSeries = await recalculateSeriesPointsTable(seriesId);
  const leaderboards = await getSeriesLeaderboards(seriesId);

  // Compute team wins map and series scoreline
  const teamWins = {};
  series.teams.forEach(t => {
    teamWins[t._id.toString()] = 0;
  });

  let completedMatchesCount = 0;
  let liveMatchesCount = 0;
  let upcomingMatchesCount = 0;

  matches.forEach(m => {
    if (m.status === 'Completed') {
      completedMatchesCount++;
      if (m.result && m.result.winner) {
        const wId = m.result.winner._id ? m.result.winner._id.toString() : m.result.winner.toString();
        teamWins[wId] = (teamWins[wId] || 0) + 1;
      }
    } else if (m.status === 'Live' || m.status === 'Innings Break') {
      liveMatchesCount++;
    } else {
      upcomingMatchesCount++;
    }
  });

  const totalMatches = series.totalMatches || Math.max(3, matches.length);

  // Generate readable series status scoreline
  let seriesStatusText = '';
  if (series.teams.length === 2) {
    const tA = series.teams[0];
    const tB = series.teams[1];
    const tAWins = teamWins[tA._id.toString()] || 0;
    const tBWins = teamWins[tB._id.toString()] || 0;

    const scoreline = `${tA.shortCode || tA.name} ${tAWins} - ${tBWins} ${tB.shortCode || tB.name}`;

    if (completedMatchesCount === 0) {
      seriesStatusText = `${totalMatches}-Match Series (${scoreline})`;
    } else if (completedMatchesCount >= totalMatches) {
      if (tAWins > tBWins) {
        seriesStatusText = `${tA.name} won the ${totalMatches}-match series ${tAWins}-${tBWins}!`;
      } else if (tBWins > tAWins) {
        seriesStatusText = `${tB.name} won the ${totalMatches}-match series ${tBWins}-${tAWins}!`;
      } else {
        seriesStatusText = `Series Drawn ${tAWins}-${tBWins} (${totalMatches} Matches)`;
      }
    } else {
      // In progress
      if (tAWins > tBWins) {
        seriesStatusText = `${tA.name} leads ${tAWins}-${tBWins} (${completedMatchesCount}/${totalMatches} played)`;
      } else if (tBWins > tAWins) {
        seriesStatusText = `${tB.name} leads ${tBWins}-${tAWins} (${completedMatchesCount}/${totalMatches} played)`;
      } else {
        seriesStatusText = `Series Level ${tAWins}-${tBWins} (${completedMatchesCount}/${totalMatches} played)`;
      }
    }
  } else {
    seriesStatusText = `${series.name} • ${completedMatchesCount} of ${totalMatches} matches completed`;
  }

  return {
    series: updatedSeries,
    seriesStatusText,
    totalMatches,
    completedMatchesCount,
    liveMatchesCount,
    upcomingMatchesCount,
    teamWins,
    matches,
    pointsTable: updatedSeries.pointsTable,
    leaderboards
  };
}

module.exports = {
  recalculateSeriesPointsTable,
  getSeriesLeaderboards,
  getSeriesSummary,
  syncGlobalPlayerStats,
  oversToDecimal
};
