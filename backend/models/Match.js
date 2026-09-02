const mongoose = require('mongoose');

const batsmanStatsSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  inningsAttempt: { type: Number, default: 1 },
  isOppositeHand: { type: Boolean, default: false },
  runs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  isOut: { type: Boolean, default: false },
  dismissal: { type: String, default: 'Not Out' },
  bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  fielder: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null }
}, { _id: false });

const bowlerStatsSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  overs: { type: Number, default: 0.0 },
  ballsBowled: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  runsConceded: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 }
}, { _id: false });

const fallOfWicketSchema = new mongoose.Schema({
  wicketNumber: { type: Number, required: true },
  score: { type: Number, required: true },
  overs: { type: String, required: true },
  playerOut: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }
}, { _id: false });

const inningsSchema = new mongoose.Schema({
  inningsNumber: { type: Number, required: true },
  battingTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  bowlingTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  totalRuns: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  maxWicketsForInnings: { type: Number, default: 10 },
  overs: { type: Number, default: 0.0 },
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 }
  },
  striker: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  currentBowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  batsmenStats: [batsmanStatsSchema],
  bowlerStats: [bowlerStatsSchema],
  fallOfWickets: [fallOfWicketSchema]
}, { _id: false });

const matchSchema = new mongoose.Schema({
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  title: { type: String, required: true },
  venue: { type: String, default: 'MSCA Arena' },
  totalOvers: { type: Number, required: true, default: 10 },

  // Admin-defined Extra Runs and MSCA Options
  customRules: {
    widePenaltyRuns: { type: Number, default: 1 }, // 0 (no run, only re-bowl), 1 (standard), 2
    noBallPenaltyRuns: { type: Number, default: 1 }, // 0 (only free hit/ball), 1, 2
    allOutThresholdType: { 
      type: String, 
      enum: ['AllPlayersOut', 'StandardPartnership'], 
      default: 'AllPlayersOut' 
    },
    allowDoubleBatting: { type: Boolean, default: true },
    oppositeHandRule: { type: Boolean, default: true },
    lastManStandsAlone: { type: Boolean, default: true }
  },

  // Team A: dynamic count (e.g. 5 players -> 5 wickets to all-out)
  teamA: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    maxWickets: { type: Number, default: 10 }
  },

  // Team B: dynamic count (e.g. 6 players -> 6 wickets to all-out)
  teamB: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    maxWickets: { type: Number, default: 10 }
  },

  status: { 
    type: String, 
    enum: ['Upcoming', 'Live', 'Innings Break', 'Completed'], 
    default: 'Upcoming' 
  },
  currentInningsNumber: { type: Number, default: 1 },
  toss: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    decision: { type: String, enum: ['bat', 'bowl'], default: 'bat' }
  },
  result: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    margin: { type: String, default: '' },
    winType: { type: String, enum: ['runs', 'wickets', 'tie', 'draw', 'no_result', ''], default: '' }
  },
  innings: [inningsSchema]
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
