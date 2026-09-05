const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
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
const __dirnames = path.resolve();

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/series', seriesRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/score', scoreRoutes);

// Frontend Static Production Serving
// const frontendDistPath = path.join(__dirname, '../frontend/dist');
const isFrontendBuilt = fs.existsSync(frontendDistPath);

// if (process.env.NODE_ENV === 'production' || isFrontendBuilt) {
//     // Serve static frontend assets
//     app.use(express.static(frontendDistPath));

//     // Handle React SPA client-side routing (fallback to index.html for non-API routes)
//     app.use((req, res) => {
//         if (req.originalUrl.startsWith('/api')) {
//             return res.status(404).json({ message: 'API route not found' });
//         }
//         res.sendFile(path.join(frontendDistPath, 'index.html'));
//     });
// } else {
//     // Development Root Route (API info when frontend is not built in backend dir)
//     app.get('/', (req, res) => {
//         res.json({
//             status: 'online',
//             project: 'MSCA — Marathishala Cricket Association API',
//             version: '1.0.0',
//             endpoints: {
//                 series: '/api/series',
//                 teams: '/api/teams',
//                 players: '/api/players',
//                 matches: '/api/matches',
//                 score: '/api/score',
//                 health: '/api/health'
//             },
//             compassConnection: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/msca'
//         });
//     });
// }

// Global Error Handler

// Serve static files and handle frontend routes

// Only serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirnames, '../frontend/dist')));

    app.get('*', (req, res) => {
        // Only handle non-API routes with frontend
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(__dirnames, 'frontend', 'dist', 'index.html'));
        }
    });
}

app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🏏 MSCA Cricket Backend Server Running!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/msca'}`);
    console.log(`⚡ Production Frontend: ${isFrontendBuilt ? 'Enabled (serving /frontend/dist)' : 'Disabled (API Mode)'}`);
    console.log(`=========================================`);
});
