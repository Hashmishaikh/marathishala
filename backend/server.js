const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketHandler');

// Import routes
const seriesRoutes = require('./routes/seriesRoutes');
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');
const matchRoutes = require('./routes/matchRoutes');
const scoreRoutes = require('./routes/scoreRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
initSocket(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Health check and root route
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        project: 'MSCA — Marathishala Cricket Association API',
        version: '1.0.0',
        endpoints: {
            series: '/api/series',
            teams: '/api/teams',
            players: '/api/players',
            matches: '/api/matches',
            score: '/api/score'
        },
        compassConnection: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mscalive'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/series', seriesRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/score', scoreRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🏏 MSCA Cricket Backend Server Running!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ MongoDB Compass URI: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/msca'}`);
    console.log(`=========================================`);
});
