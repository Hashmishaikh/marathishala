const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  shortCode: { type: String, required: true, uppercase: true, trim: true },
  logoUrl: { type: String, default: '' },
  colorHex: { type: String, default: '#0284c7' }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
