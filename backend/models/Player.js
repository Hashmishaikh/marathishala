const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { 
    type: String, 
    enum: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'], 
    default: 'All-Rounder' 
  },
  battingStyle: { 
    type: String, 
    enum: ['Right-hand', 'Left-hand'], 
    default: 'Right-hand' 
  },
  bowlingStyle: { 
    type: String, 
    enum: ['Right-arm Fast', 'Left-arm Fast', 'Right-arm Spin', 'Left-arm Spin', 'None'], 
    default: 'Right-arm Fast' 
  },
  avatar: { type: String, default: '' },
  stats: {
    matches: { type: Number, default: 0 },
    innings: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    fifties: { type: Number, default: 0 },
    hundreds: { type: Number, default: 0 },
    notOuts: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    ballsBowled: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    bestBowling: { 
      wickets: { type: Number, default: 0 }, 
      runs: { type: Number, default: 0 } 
    },
    catches: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
