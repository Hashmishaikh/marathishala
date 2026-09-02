const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Team = require('./models/Team');
const Player = require('./models/Player');
const Series = require('./models/Series');
const Match = require('./models/Match');
const Delivery = require('./models/Delivery');

const samplePlayers = [
  { name: 'Sachin Joshi', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Spin' },
  { name: 'Rohit Kulkarni', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast' },
  { name: 'Ajinkya Patil', role: 'All-Rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast' },
  { name: 'Ruturaj Shinde', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'None' },
  { name: 'Kedar Jadhav', role: 'All-Rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Spin' },
  { name: 'Shardul Deshmukh', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast' },
  { name: 'Rahul Chougule', role: 'Wicket-Keeper', battingStyle: 'Right-hand', bowlingStyle: 'None' },
  { name: 'Siddhesh Gaikwad', role: 'All-Rounder', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm Fast' },
  { name: 'Prathamesh Mane', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Left-arm Spin' },
  { name: 'Tanmay More', role: 'Batsman', battingStyle: 'Left-hand', bowlingStyle: 'None' },
  { name: 'Omkar Bhosale', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast' },
  { name: 'Swapnil Chavan', role: 'All-Rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Spin' }
];

const sampleTeams = [
  { name: 'Shivaji Park Warriors', shortCode: 'SPW', colorHex: '#0284c7' },
  { name: 'Marathishala Titans', shortCode: 'MST', colorHex: '#ea580c' },
  { name: 'Sahyadri Strikers', shortCode: 'SAS', colorHex: '#16a34a' },
  { name: 'Deccan Royals', shortCode: 'DCR', colorHex: '#9333ea' }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/msca');
    console.log('Connected to MongoDB for Seeding...');

    // Clear existing data
    await Delivery.deleteMany({});
    await Match.deleteMany({});
    await Series.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});

    console.log('Cleared existing collections...');

    // Insert Players
    const createdPlayers = await Player.insertMany(samplePlayers);
    console.log(`Created ${createdPlayers.length} players`);

    // Insert Teams
    const createdTeams = await Team.insertMany(sampleTeams);
    console.log(`Created ${createdTeams.length} teams`);

    // Create a Tournament / Series
    const series = new Series({
      name: 'MSCA Premier Trophy 2026',
      format: 'Gully Box',
      defaultOvers: 8,
      teams: createdTeams.map(t => t._id),
      status: 'Ongoing',
      pointsTable: createdTeams.map(t => ({ team: t._id }))
    });
    await series.save();
    console.log(`Created Series: ${series.name}`);

    // Create a sample Match (5 vs 6 Dynamic Squad / Gully Box with MSCA custom rules)
    const teamAPlayers = createdPlayers.slice(0, 5).map(p => p._id);
    const teamBPlayers = createdPlayers.slice(5, 11).map(p => p._id);

    const match = new Match({
      seriesId: series._id,
      title: 'Match 1: Shivaji Park Warriors vs Marathishala Titans',
      venue: 'Marathishala Ground, Dadar',
      totalOvers: 6,
      customRules: {
        widePenaltyRuns: 1,
        noBallPenaltyRuns: 1,
        allOutThresholdType: 'AllPlayersOut',
        allowDoubleBatting: true,
        oppositeHandRule: true,
        lastManStandsAlone: true
      },
      teamA: {
        teamId: createdTeams[0]._id,
        players: teamAPlayers,
        maxWickets: 5 // 5-player squad -> 5 wickets all-out
      },
      teamB: {
        teamId: createdTeams[1]._id,
        players: teamBPlayers,
        maxWickets: 6 // 6-player squad -> 6 wickets all-out
      },
      status: 'Upcoming',
      currentInningsNumber: 1,
      innings: []
    });

    await match.save();
    console.log(`Created Sample Match: ${match.title}`);

    console.log('✅ Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
}

seedDatabase();
