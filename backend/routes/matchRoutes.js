const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { broadcastMatchUpdate } = require('../socket/socketHandler');
const { recalculateSeriesPointsTable, syncGlobalPlayerStats } = require('../services/statsService');

// Get all matches (filter by seriesId, status)
router.get('/', async (req, res) => {
  try {
    const { seriesId, status } = req.query;
    const query = {};
    if (seriesId) query.seriesId = seriesId;
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate('teamA.teamId teamB.teamId seriesId result.winner toss.winner')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single match details with complete scorecard
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate([
        { path: 'seriesId' },
        { path: 'teamA.teamId' },
        { path: 'teamB.teamId' },
        { path: 'teamA.players' },
        { path: 'teamB.players' },
        { path: 'toss.winner' },
        { path: 'result.winner' },
        { path: 'innings.battingTeam' },
        { path: 'innings.bowlingTeam' },
        { path: 'innings.striker' },
        { path: 'innings.nonStriker' },
        { path: 'innings.currentBowler' },
        { path: 'innings.batsmenStats.player' },
        { path: 'innings.batsmenStats.bowler' },
        { path: 'innings.batsmenStats.fielder' },
        { path: 'innings.bowlerStats.player' },
        { path: 'innings.fallOfWickets.playerOut' }
      ]);

    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new match with MSCA custom rules & dynamic squad sizing
router.post('/', async (req, res) => {
  try {
    const {
      seriesId,
      title,
      venue,
      totalOvers,
      customRules,
      teamA,
      teamB
    } = req.body;

    if (!title || !teamA?.teamId || !teamB?.teamId) {
      return res.status(400).json({ message: 'Title, Team A and Team B are required' });
    }

    const allOutType = customRules?.allOutThresholdType || 'AllPlayersOut';

    // Compute dynamic max wickets per team based on squad size
    const teamAPlayerCount = (teamA.players && teamA.players.length) ? teamA.players.length : 10;
    const teamBPlayerCount = (teamB.players && teamB.players.length) ? teamB.players.length : 10;

    const teamAMaxWickets = teamA.maxWickets !== undefined 
      ? teamA.maxWickets 
      : (allOutType === 'AllPlayersOut' ? teamAPlayerCount : Math.max(1, teamAPlayerCount - 1));

    const teamBMaxWickets = teamB.maxWickets !== undefined 
      ? teamB.maxWickets 
      : (allOutType === 'AllPlayersOut' ? teamBPlayerCount : Math.max(1, teamBPlayerCount - 1));

    const match = new Match({
      seriesId: seriesId || null,
      title,
      venue: venue || 'MSCA Arena',
      totalOvers: totalOvers || 10,
      customRules: {
        widePenaltyRuns: customRules?.widePenaltyRuns !== undefined ? customRules.widePenaltyRuns : 1,
        noBallPenaltyRuns: customRules?.noBallPenaltyRuns !== undefined ? customRules.noBallPenaltyRuns : 1,
        allOutThresholdType: allOutType,
        allowDoubleBatting: customRules?.allowDoubleBatting !== undefined ? customRules.allowDoubleBatting : true,
        oppositeHandRule: customRules?.oppositeHandRule !== undefined ? customRules.oppositeHandRule : true,
        lastManStandsAlone: customRules?.lastManStandsAlone !== undefined ? customRules.lastManStandsAlone : true
      },
      teamA: {
        teamId: teamA.teamId,
        players: teamA.players || [],
        maxWickets: teamAMaxWickets
      },
      teamB: {
        teamId: teamB.teamId,
        players: teamB.players || [],
        maxWickets: teamBMaxWickets
      },
      status: 'Upcoming',
      currentInningsNumber: 1,
      innings: []
    });

    const savedMatch = await match.save();
    const populated = await Match.findById(savedMatch._id).populate('teamA.teamId teamB.teamId seriesId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start match (Toss & 1st Innings initialization)
router.post('/:id/start', async (req, res) => {
  try {
    const { tossWinnerId, tossDecision, strikerId, nonStrikerId, openingBowlerId } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    let battingTeamId, bowlingTeamId;
    const teamAId = match.teamA.teamId.toString();
    const teamBId = match.teamB.teamId.toString();
    const tossWinner = tossWinnerId || teamAId;
    const decision = tossDecision || 'bat';

    if (tossWinner === teamAId) {
      battingTeamId = decision === 'bat' ? teamAId : teamBId;
      bowlingTeamId = decision === 'bat' ? teamBId : teamAId;
    } else {
      battingTeamId = decision === 'bat' ? teamBId : teamAId;
      bowlingTeamId = decision === 'bat' ? teamAId : teamBId;
    }

    const battingSquadMaxWickets = battingTeamId === teamAId ? match.teamA.maxWickets : match.teamB.maxWickets;

    // Initialize Innings 1
    match.toss = { winner: tossWinner, decision };
    match.status = 'Live';
    match.currentInningsNumber = 1;

    const innings1 = {
      inningsNumber: 1,
      battingTeam: battingTeamId,
      bowlingTeam: bowlingTeamId,
      totalRuns: 0,
      wickets: 0,
      maxWicketsForInnings: battingSquadMaxWickets,
      overs: 0.0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      striker: strikerId || null,
      nonStriker: nonStrikerId || null,
      currentBowler: openingBowlerId || null,
      batsmenStats: [],
      bowlerStats: [],
      fallOfWickets: []
    };

    if (strikerId) {
      innings1.batsmenStats.push({
        player: strikerId,
        inningsAttempt: 1,
        isOppositeHand: false,
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: 'Not Out'
      });
    }

    if (nonStrikerId) {
      innings1.batsmenStats.push({
        player: nonStrikerId,
        inningsAttempt: 1,
        isOppositeHand: false,
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: 'Not Out'
      });
    }

    if (openingBowlerId) {
      innings1.bowlerStats.push({
        player: openingBowlerId,
        overs: 0.0, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0
      });
    }

    match.innings = [innings1];
    await match.save();

    const populated = await Match.findById(match._id).populate([
      { path: 'teamA.teamId' },
      { path: 'teamB.teamId' },
      { path: 'teamA.players' },
      { path: 'teamB.players' },
      { path: 'innings.striker' },
      { path: 'innings.nonStriker' },
      { path: 'innings.currentBowler' }
    ]);

    broadcastMatchUpdate(match._id.toString(), 'match_started', populated);
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start 2nd Innings
router.post('/:id/start-second-innings', async (req, res) => {
  try {
    const { strikerId, nonStrikerId, openingBowlerId } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.innings.length < 1) {
      return res.status(400).json({ message: 'First innings must exist before starting second innings' });
    }

    const inn1 = match.innings[0];
    const battingTeamId = inn1.bowlingTeam;
    const bowlingTeamId = inn1.battingTeam;

    const battingSquadMaxWickets = battingTeamId.toString() === match.teamA.teamId.toString() 
      ? match.teamA.maxWickets 
      : match.teamB.maxWickets;

    const innings2 = {
      inningsNumber: 2,
      battingTeam: battingTeamId,
      bowlingTeam: bowlingTeamId,
      totalRuns: 0,
      wickets: 0,
      maxWicketsForInnings: battingSquadMaxWickets,
      overs: 0.0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      striker: strikerId || null,
      nonStriker: nonStrikerId || null,
      currentBowler: openingBowlerId || null,
      batsmenStats: [],
      bowlerStats: [],
      fallOfWickets: []
    };

    if (strikerId) {
      innings2.batsmenStats.push({
        player: strikerId,
        inningsAttempt: 1,
        isOppositeHand: false,
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: 'Not Out'
      });
    }

    if (nonStrikerId) {
      innings2.batsmenStats.push({
        player: nonStrikerId,
        inningsAttempt: 1,
        isOppositeHand: false,
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: 'Not Out'
      });
    }

    if (openingBowlerId) {
      innings2.bowlerStats.push({
        player: openingBowlerId,
        overs: 0.0, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0
      });
    }

    match.innings.push(innings2);
    match.currentInningsNumber = 2;
    match.status = 'Live';

    await match.save();

    const populated = await Match.findById(match._id).populate([
      { path: 'teamA.teamId' },
      { path: 'teamB.teamId' },
      { path: 'teamA.players' },
      { path: 'teamB.players' },
      { path: 'innings.striker' },
      { path: 'innings.nonStriker' },
      { path: 'innings.currentBowler' }
    ]);

    broadcastMatchUpdate(match._id.toString(), 'second_innings_started', populated);
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update match rules or squad
router.put('/:id', async (req, res) => {
  try {
    const { title, venue, totalOvers, customRules, teamA, teamB, status } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (title) match.title = title;
    if (venue) match.venue = venue;
    if (totalOvers) match.totalOvers = totalOvers;
    if (status) match.status = status;
    if (teamA) {
      match.teamA = { 
        ...match.teamA.toObject(), 
        ...teamA,
        players: teamA.players || match.teamA.players,
        maxWickets: teamA.maxWickets || (teamA.players ? (match.customRules?.allOutThresholdType === 'AllPlayersOut' ? teamA.players.length : Math.max(1, teamA.players.length - 1)) : match.teamA.maxWickets)
      };
    }
    if (teamB) {
      match.teamB = { 
        ...match.teamB.toObject(), 
        ...teamB,
        players: teamB.players || match.teamB.players,
        maxWickets: teamB.maxWickets || (teamB.players ? (match.customRules?.allOutThresholdType === 'AllPlayersOut' ? teamB.players.length : Math.max(1, teamB.players.length - 1)) : match.teamB.maxWickets)
      };
    }

    const updated = await match.save();
    const populated = await Match.findById(updated._id).populate('teamA.teamId teamB.teamId teamA.players teamB.players');
    broadcastMatchUpdate(match._id.toString(), 'match_updated', populated);
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// End match and sync series points & player stats
router.post('/:id/end-match', async (req, res) => {
  try {
    const { winnerId, margin, winType } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    match.status = 'Completed';
    if (winnerId !== undefined || margin !== undefined) {
      match.result = {
        winner: winnerId || null,
        margin: margin || '',
        winType: winType || ''
      };
    }

    await match.save();

    // Recalculate series points table if match belongs to a series
    if (match.seriesId) {
      await recalculateSeriesPointsTable(match.seriesId);
    }
    // Sync lifetime career stats
    await syncGlobalPlayerStats();

    const populated = await Match.findById(match._id).populate('teamA.teamId teamB.teamId result.winner');
    broadcastMatchUpdate(match._id.toString(), 'match_completed', populated);

    res.json({ message: 'Match concluded and stats synced', match: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete match
router.delete('/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
