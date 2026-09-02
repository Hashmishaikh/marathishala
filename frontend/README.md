# MSCA — Marathishala Cricket Association Frontend

Modern, sleek, and high-performance React (Vite + TypeScript) scoring & live broadcast interface for the Marathishala Cricket Association (MSCA).

---

## ✨ Features & UI Components

1. **⚡ Admin Touch Scoring Console (`AdminScorerScreen.tsx`)**:
   - **Keypad**: Large responsive touch targets (0, 1, 2, 3, 4, 6) for rapid umpire / scorer entry.
   - **Extras Matrix**: Configurable Wides, No-Balls, Byes, and Leg-Byes.
   - **Wicket Modal**: Complete dismissal methods (`Bowled`, `Caught`, `Caught Behind`, `Caught & Bowled`, `LBW`, `Stumped`, `Run Out`, `Hit Wicket`, `Retired`) with fielder selector and bowler credit calculation.
   - **Double-Batting & Opposite Hand Mandate**: Support for uneven matches (e.g. 5 vs 6) where a dismissed batsman is unlocked for a 2nd turn batting opposite stance (RHB $\rightarrow$ LHB).
   - **Event-Sourcing Over Timeline & Ball Edit**: Tap any historical delivery to adjust runs/extras with deterministic state re-calculation.
   - **One-Tap Rollback (Undo)**: Instant undo of the last ball.
   - **Strike Rotation & Crease Management**: Real-time striker (*) and non-striker tracking with manual swap strike.

2. **📺 Spectator Live View (`MatchViewerScreen.tsx`)**:
   - Real-time room broadcast with Socket.io.
   - Live Header with Current Run Rate (CRR), Required Run Rate (RRR), Target chasing, and Dynamic All-Out indicators ($W/MaxW$).
   - Crease Card with active batters strike rate and active bowler figures.
   - Full Scorecard tabs (Batting, Bowling, Fall of Wickets).

3. **🏆 Tournament Hub & Standings (`SeriesHubScreen.tsx`)**:
   - Points table with Net Run Rate (NRR) calculation.
   - **Orange Cap** card (Top run scorer) & **Purple Cap** card (Top wicket taker).
   - Tournament creation modal.

4. **🛡️ Teams & Decoupled Player Pool (`TeamsPlayersScreen.tsx`)**:
   - Roster manager and custom team creation with theme colors.
   - Global player pool with search, role filters, and career statistics (Matches, Innings, Runs, Wickets, Best Bowling, Strike Rate).

5. **🏏 Dynamic Fixture Setup (`CreateMatchScreen.tsx`)**:
   - Dynamic squad sizing (3v3 to 11v11) e.g. 5 vs 6 players.
   - Configurable MSCA Gully Rules (Wide/No-Ball penalty 0, 1, 2, True Total All-Out vs Standard, Double Batting).

---

## 🚀 Running the Frontend

```bash
cd frontend
npm install
npm run dev
```
The frontend runs at `http://localhost:5173` and connects to the MSCA backend at `http://localhost:5001`.
