const mongoose = require('mongoose');

const pointsTableEntrySchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  tied: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  runsScored: { type: Number, default: 0 },
  oversFaced: { type: Number, default: 0 },
  runsConceded: { type: Number, default: 0 },
  oversBowled: { type: Number, default: 0 },
  netRunRate: { type: Number, default: 0.0 }
}, { _id: false });

const seriesSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "MSCA Trophy 2026", "MSCA Weekend Cup"
  format: { 
    type: String, 
    enum: ['Gully Box', 'T20', 'ODI', 'Custom Overs'], 
    default: 'Gully Box' 
  },
  defaultOvers: { type: Number, default: 10 },
  totalMatches: { type: Number, default: 3 },
  description: { type: String, default: '' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  status: { 
    type: String, 
    enum: ['Upcoming', 'Ongoing', 'Completed'], 
    default: 'Ongoing' 
  },
  pointsTable: [pointsTableEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('Series', seriesSchema);
