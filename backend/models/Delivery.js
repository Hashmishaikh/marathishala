const mongoose = require('mongoose');

const wicketDetailsSchema = new mongoose.Schema({
  dismissalType: { 
    type: String, 
    enum: [
      'Bowled', 
      'Caught', 
      'Caught Behind', 
      'Caught & Bowled', 
      'LBW', 
      'Stumped', 
      'Run Out', 
      'Hit Wicket', 
      'Retired'
    ],
    required: true
  },
  playerOut: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  bowlerCredit: { type: Boolean, default: true },
  primaryFielder: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  assistedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null }
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  inningsNumber: { type: Number, required: true },
  overNumber: { type: Number, required: true },
  ballNumber: { type: Number, required: true },
  bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  striker: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  runsOffBat: { type: Number, default: 0 },
  extraType: { 
    type: String, 
    enum: ['None', 'Wide', 'NoBall', 'Bye', 'LegBye'], 
    default: 'None' 
  },
  penaltyExtraRuns: { type: Number, default: 0 },
  runningExtraRuns: { type: Number, default: 0 },
  isWicket: { type: Boolean, default: false },
  wicket: { type: wicketDetailsSchema, default: null }
}, { timestamps: true });

deliverySchema.index({ matchId: 1, inningsNumber: 1, createdAt: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
