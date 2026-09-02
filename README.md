# MSCA — Marathishala Cricket Association Backend API

Complete Node.js, Express, MongoDB (Mongoose), and Socket.io backend for the Marathishala Cricket Association (MSCA) application based on the master engineering specification.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure MongoDB Compass
Open **MongoDB Compass** and connect to your local MongoDB instance using:
```
mongodb://127.0.0.1:27017/msca
```
Or configure your custom URI in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/msca
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Seed Sample Data (Optional)
To populate sample teams, players, a tournament, and a match:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Server runs at `http://localhost:5000` with real-time Socket.io enabled.

---

## 🏏 MSCA Gully Rules & Feature Matrix

- **Configurable Extras (Wide & No-Ball)**: Admin configures per match/tournament whether a Wide or No-Ball adds 0, 1, or 2 penalty runs.
- **True Total All-Out (e.g. 5/5 or 6/6 Dismissals)**: Innings continues until all players in the squad are dismissed (Last-Man-Stands or Double-Batting).
- **Double Batting & Opposite Hand Rule**: In uneven fixtures (e.g. 5 vs 6), the 5-player team can send a dismissed player for a second batting turn batting with the opposite hand (RHB bats LH, LHB bats RH).
- **Decoupled Player Pool**: Global player repository with lifetime career statistics (runs, wickets, strike rate, best bowling, catches, etc.).
- **Event Sourcing Replay Engine**: Every delivery is an immutable event; one-tap instant undo and historical ball edits replay the match state deterministically.
- **Socket.io Live Broadcast**: Real-time room-based updates for connected scorer consoles and spectator viewer apps.

---

## 📡 REST API Documentation

### 1. Series / Tournaments (`/api/series`)
- `GET /api/series` - List all tournaments
- `GET /api/series/:id` - Get tournament details
- `POST /api/series` - Create tournament
- `PUT /api/series/:id` - Update tournament
- `DELETE /api/series/:id` - Delete tournament
- `GET /api/series/:id/points-table` - Standings & Net Run Rate (NRR)
- `GET /api/series/:id/leaderboards` - Orange Cap (Top Batsmen) & Purple Cap (Top Bowlers)
- `POST /api/series/:id/add-team` - Add team to series

### 2. Teams (`/api/teams`)
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create team (`name`, `shortCode`, `logoUrl`, `colorHex`)
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### 3. Global Players Pool (`/api/players`)
- `GET /api/players` - List players (supports `?search=` and `?role=`)
- `GET /api/players/:id` - Get player profile and lifetime career statistics
- `POST /api/players` - Register player (`name`, `role`, `battingStyle`, `bowlingStyle`, `avatar`)
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player
- `POST /api/players/sync-stats` - Synchronize career stats from all completed matches

### 4. Matches (`/api/matches`)
- `GET /api/matches` - List matches (supports `?seriesId=` and `?status=`)
- `GET /api/matches/:id` - Get full scorecard, live score, and ball log
- `POST /api/matches` - Create match with custom rules & dynamic squad sizing (3v3 to 11v11)
- `POST /api/matches/:id/start` - Record toss and start 1st innings
- `POST /api/matches/:id/start-second-innings` - Start 2nd innings
- `POST /api/matches/:id/end-match` - Manually finish match & trigger points/stats sync
- `PUT /api/matches/:id` - Update match metadata
- `DELETE /api/matches/:id` - Delete match

### 5. Touch Scoring & Event Sourcing (`/api/score`)
- `GET /api/score/:matchId/deliveries` - Get delivery event log
- `POST /api/score/:matchId/ball` - Record delivery (`runsOffBat`, `extraType`, `runningExtraRuns`, `isWicket`, `wicket`)
- `POST /api/score/:matchId/undo` - One-tap undo last delivery and replay state
- `PUT /api/score/delivery/:deliveryId` - Edit historical delivery and recalculate state
- `POST /api/score/:matchId/swap-strike` - Swap batsman strike
- `POST /api/score/:matchId/set-batsman` - Set next batsman (with `isOppositeHand: true` support)
- `POST /api/score/:matchId/set-bowler` - Set active bowler for over
- `POST /api/score/:matchId/rebuild` - Deterministically rebuild innings from scratch

---

## ⚡ Socket.io Real-Time Events

### Client -> Server
- `join_match` (param: `matchId`) - Join match room `match_{matchId}`
- `leave_match` (param: `matchId`) - Leave match room

### Server -> Client Broadcasts
- `score_updated` - Emitted when a ball is scored
- `ball_undone` - Emitted when a ball is undone
- `delivery_edited` - Emitted when a historical ball is edited
- `match_started` - Emitted when innings 1 starts
- `second_innings_started` - Emitted when innings 2 starts
- `match_completed` - Emitted when match ends
- `strike_swapped` - Emitted when strike changes
- `batsman_set` / `bowler_set` - Emitted when crease players change
