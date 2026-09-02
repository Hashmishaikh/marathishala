const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const { syncGlobalPlayerStats } = require('../services/statsService');

// Get all players (with optional search and role filtering)
router.get('/', async (req, res) => {
  try {
    const { search, role } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (role) {
      query.role = role;
    }

    const players = await Player.find(query).sort({ name: 1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get player by ID
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create player
router.post('/', async (req, res) => {
  try {
    const { name, role, battingStyle, bowlingStyle, avatar } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Player name is required' });
    }

    const player = new Player({
      name,
      role: role || 'All-Rounder',
      battingStyle: battingStyle || 'Right-hand',
      bowlingStyle: bowlingStyle || 'Right-arm Fast',
      avatar: avatar || ''
    });

    const savedPlayer = await player.save();
    res.status(201).json(savedPlayer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update player
router.put('/:id', async (req, res) => {
  try {
    const { name, role, battingStyle, bowlingStyle, avatar, stats } = req.body;
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });

    if (name) player.name = name;
    if (role) player.role = role;
    if (battingStyle) player.battingStyle = battingStyle;
    if (bowlingStyle) player.bowlingStyle = bowlingStyle;
    if (avatar !== undefined) player.avatar = avatar;
    if (stats) player.stats = { ...player.stats, ...stats };

    const updatedPlayer = await player.save();
    res.json(updatedPlayer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete player
router.delete('/:id', async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync lifetime player stats
router.post('/sync-stats', async (req, res) => {
  try {
    await syncGlobalPlayerStats();
    res.json({ message: 'Player career stats synchronized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
