const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new team
router.post('/', async (req, res) => {
  try {
    const { name, shortCode, logoUrl, colorHex } = req.body;
    if (!name || !shortCode) {
      return res.status(400).json({ message: 'Name and Short Code are required' });
    }

    const team = new Team({
      name,
      shortCode: shortCode.toUpperCase(),
      logoUrl: logoUrl || '',
      colorHex: colorHex || '#0284c7'
    });

    const savedTeam = await team.save();
    res.status(201).json(savedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update team
router.put('/:id', async (req, res) => {
  try {
    const { name, shortCode, logoUrl, colorHex } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (name) team.name = name;
    if (shortCode) team.shortCode = shortCode.toUpperCase();
    if (logoUrl !== undefined) team.logoUrl = logoUrl;
    if (colorHex) team.colorHex = colorHex;

    const updatedTeam = await team.save();
    res.json(updatedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete team
router.delete('/:id', async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
