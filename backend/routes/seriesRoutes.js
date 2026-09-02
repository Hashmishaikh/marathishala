const express = require('express');
const router = express.Router();
const Series = require('../models/Series');
const Match = require('../models/Match');
const Player = require('../models/Player');
const { recalculateSeriesPointsTable, getSeriesLeaderboards, getSeriesSummary } = require('../services/statsService');

// Get all series
router.get('/', async (req, res) => {
  try {
    const seriesList = await Series.find()
      .populate('teams')
      .populate('pointsTable.team')
      .sort({ createdAt: -1 });
    res.json(seriesList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get series by ID
router.get('/:id', async (req, res) => {
  try {
    const series = await Series.findById(req.params.id)
      .populate('teams')
      .populate('pointsTable.team');
    if (!series) return res.status(404).json({ message: 'Series not found' });
    res.json(series);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get comprehensive series summary (Scoreline, Matches, Leaderboards, Rankings, Points Table)
router.get('/:id/summary', async (req, res) => {
  try {
    const summary = await getSeriesSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new series
router.post('/', async (req, res) => {
  try {
    const { name, format, defaultOvers, totalMatches, description, teams, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Series name is required' });
    }

    const series = new Series({
      name,
      format: format || 'Gully Box',
      defaultOvers: defaultOvers || 10,
      totalMatches: totalMatches || 3,
      description: description || '',
      teams: teams || [],
      status: status || 'Ongoing',
      pointsTable: (teams || []).map(t => ({ team: t }))
    });

    const savedSeries = await series.save();
    const populated = await Series.findById(savedSeries._id).populate('teams pointsTable.team');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update series
router.put('/:id', async (req, res) => {
  try {
    const { name, format, defaultOvers, totalMatches, description, teams, status } = req.body;
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });

    if (name) series.name = name;
    if (format) series.format = format;
    if (defaultOvers) series.defaultOvers = defaultOvers;
    if (totalMatches) series.totalMatches = totalMatches;
    if (description !== undefined) series.description = description;
    if (status) series.status = status;
    if (teams) {
      series.teams = teams;
      // Sync points table teams
      const existingTeams = series.pointsTable.map(p => p.team.toString());
      teams.forEach(tId => {
        if (!existingTeams.includes(tId.toString())) {
          series.pointsTable.push({ team: tId });
        }
      });
    }

    const updatedSeries = await series.save();
    const populated = await Series.findById(updatedSeries._id).populate('teams pointsTable.team');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Auto-generate matches for a series
router.post('/:id/generate-matches', async (req, res) => {
  try {
    const { 
      matchCount = 3, 
      teamAId, 
      teamBId, 
      teamAPlayerIds, 
      teamBPlayerIds, 
      venue = 'MSCA Ground', 
      totalOvers = 8, 
      customRules 
    } = req.body;
    const series = await Series.findById(req.params.id).populate('teams');
    if (!series) return res.status(404).json({ message: 'Series not found' });

    const tAId = teamAId || (series.teams.length > 0 ? series.teams[0]._id : null);
    const tBId = teamBId || (series.teams.length > 1 ? series.teams[1]._id : null);

    if (!tAId || !tBId) {
      return res.status(400).json({ message: 'Both Team A and Team B are required to generate series matches' });
    }

    // Use passed squads or fetch default players from db
    let finalTeamAPlayers = teamAPlayerIds;
    let finalTeamBPlayers = teamBPlayerIds;

    if (!finalTeamAPlayers || finalTeamAPlayers.length === 0 || !finalTeamBPlayers || finalTeamBPlayers.length === 0) {
      const players = await Player.find().limit(22);
      finalTeamAPlayers = finalTeamAPlayers?.length ? finalTeamAPlayers : players.slice(0, Math.floor(players.length / 2)).map(p => p._id);
      finalTeamBPlayers = finalTeamBPlayers?.length ? finalTeamBPlayers : players.slice(Math.floor(players.length / 2)).map(p => p._id);
    }

    const createdMatches = [];
    const count = parseInt(matchCount, 10) || 3;

    for (let i = 1; i <= count; i++) {
      const match = new Match({
        seriesId: series._id,
        title: `${series.name} - Match ${i}`,
        venue,
        totalOvers: totalOvers || series.defaultOvers || 8,
        customRules: customRules || {
          widePenaltyRuns: 1,
          noBallPenaltyRuns: 1,
          allOutThresholdType: 'AllPlayersOut',
          allowDoubleBatting: true,
          oppositeHandRule: true,
          lastManStandsAlone: true
        },
        teamA: {
          teamId: tAId,
          players: finalTeamAPlayers,
          maxWickets: finalTeamAPlayers.length || 10
        },
        teamB: {
          teamId: tBId,
          players: finalTeamBPlayers,
          maxWickets: finalTeamBPlayers.length || 10
        },
        status: 'Upcoming',
        currentInningsNumber: 1,
        innings: []
      });

      const savedMatch = await match.save();
      createdMatches.push(savedMatch);
    }

    // Update series total matches
    series.totalMatches = count;
    if (!series.teams.some(t => t._id.toString() === tAId.toString())) series.teams.push(tAId);
    if (!series.teams.some(t => t._id.toString() === tBId.toString())) series.teams.push(tBId);
    await series.save();

    res.status(201).json({
      message: `Generated ${createdMatches.length} matches for ${series.name}`,
      matches: createdMatches
    });
  } catch (error) {
    console.error('Error generating series matches:', error);
    res.status(400).json({ message: error.message });
  }
});

// Add single match to existing series (e.g. 4th match, 5th decider match)
router.post('/:id/add-match', async (req, res) => {
  try {
    const { 
      title, 
      teamAId, 
      teamBId, 
      teamAPlayerIds, 
      teamBPlayerIds, 
      venue = 'MSCA Ground', 
      totalOvers,
      customRules
    } = req.body;
    const series = await Series.findById(req.params.id).populate('teams');
    if (!series) return res.status(404).json({ message: 'Series not found' });

    const currentMatches = await Match.find({ seriesId: series._id });
    const matchNumber = currentMatches.length + 1;

    const tAId = teamAId || (series.teams.length > 0 ? series.teams[0]._id : null);
    const tBId = teamBId || (series.teams.length > 1 ? series.teams[1]._id : null);

    if (!tAId || !tBId) {
      return res.status(400).json({ message: 'Both Team A and Team B are required to add match' });
    }

    let finalTeamAPlayers = teamAPlayerIds;
    let finalTeamBPlayers = teamBPlayerIds;

    if (!finalTeamAPlayers || finalTeamAPlayers.length === 0 || !finalTeamBPlayers || finalTeamBPlayers.length === 0) {
      const players = await Player.find().limit(22);
      finalTeamAPlayers = finalTeamAPlayers?.length ? finalTeamAPlayers : players.slice(0, Math.floor(players.length / 2)).map(p => p._id);
      finalTeamBPlayers = finalTeamBPlayers?.length ? finalTeamBPlayers : players.slice(Math.floor(players.length / 2)).map(p => p._id);
    }

    const match = new Match({
      seriesId: series._id,
      title: title || `${series.name} - Match ${matchNumber}`,
      venue,
      totalOvers: totalOvers || series.defaultOvers || 8,
      customRules: customRules || {
        widePenaltyRuns: 1,
        noBallPenaltyRuns: 1,
        allOutThresholdType: 'AllPlayersOut',
        allowDoubleBatting: true,
        oppositeHandRule: true,
        lastManStandsAlone: true
      },
      teamA: {
        teamId: tAId,
        players: finalTeamAPlayers,
        maxWickets: finalTeamAPlayers.length || 10
      },
      teamB: {
        teamId: tBId,
        players: finalTeamBPlayers,
        maxWickets: finalTeamBPlayers.length || 10
      },
      status: 'Upcoming',
      currentInningsNumber: 1,
      innings: []
    });

    const savedMatch = await match.save();

    // Update series total matches
    series.totalMatches = Math.max(series.totalMatches || 0, matchNumber);
    await series.save();

    res.status(201).json({
      message: `Added Match ${matchNumber} to ${series.name}`,
      match: savedMatch
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add team to series
router.post('/:id/add-team', async (req, res) => {
  try {
    const { teamId } = req.body;
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });

    if (!series.teams.some(t => t.toString() === teamId.toString())) {
      series.teams.push(teamId);
      series.pointsTable.push({ team: teamId });
      await series.save();
    }

    const populated = await Series.findById(series._id).populate('teams pointsTable.team');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Recalculate and fetch Points Table with NRR
router.get('/:id/points-table', async (req, res) => {
  try {
    const series = await recalculateSeriesPointsTable(req.params.id);
    res.json({
      seriesName: series.name,
      pointsTable: series.pointsTable
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Orange Cap, Purple Cap & Leaderboards
router.get('/:id/leaderboards', async (req, res) => {
  try {
    const leaderboards = await getSeriesLeaderboards(req.params.id);
    res.json(leaderboards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete series
router.delete('/:id', async (req, res) => {
  try {
    const series = await Series.findByIdAndDelete(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });
    res.json({ message: 'Series deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
