# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CryptoPogs is a multiplayer real-time pog game with cryptocurrency theming. Players authenticate, join rooms, and compete in turn-based matches by "slamming" to flip pogs and collect them. Supports both PvP (multiplayer) and PvC (CPU) modes.

## Commands

```bash
# Install dependencies
npm install

# Start server (runs on PORT env var or default 3000)
node server.js

# Access game at http://localhost:3000
```

No test suite is configured.

## Architecture

### Tech Stack
- **Backend:** Node.js, Express 5, Socket.IO 4
- **Database:** SQLite3 with bcrypt for password hashing
- **Frontend:** Single HTML file with embedded CSS/JS, Socket.IO client

### File Structure
- `server.js` - Express server + Socket.IO event handlers + game logic
- `database.js` - SQLite wrapper (user CRUD, inventory management)
- `pogsthegame.html` - Complete game UI and client-side logic
- `index.html` - Landing page
- `pogs_db.sqlite` - SQLite database file

### Client-Server Communication

All game state is synchronized via Socket.IO events:

**Client → Server:**
- `register`, `login` - Authentication
- `joinRoom`, `startPvC` - Room/match setup
- `slam` - Player action: `{ roomId, power, impactY }` (aim height + power)
- `restartGame`, `refill` - Game management

**Server → Client:**
- `authSuccess/authError` - Auth responses
- `gameStart`, `gameStateUpdate`, `slamResult`, `gameOver` - Game state
- `roomList`, `updateRoom` - Lobby state

### Game State Model

Rooms are stored in-memory in a `rooms` object:
```javascript
rooms[roomId] = {
  players: [...],      // Max 2 players with socket/user info
  gameState: 'waiting' | 'playing' | 'ended',
  pogs: [...],         // Vertical stack of 12; each { id, owner, coin, faceUp, nx, ny, rot, special }
  p1Collected: [...],  // Pogs won by player 1
  p2Collected: [...],  // Pogs won by player 2
  turnIndex: 0|1,      // Whose turn
  streak: { 1, 2 },    // Consecutive scoring slams per player (3+ = "on fire")
  isPvC: boolean       // CPU game flag
}
```

### Game Flow (aim + power slam)
1. Each player contributes 6 pogs; the combined 12 form a vertical **stack** — each
   pog gets a height `ny` (+ x jitter `nx` and tilt `rot`), server-assigned in
   `initializeGame`. One 💣 bomb and one 🔒 locked pog are seeded per game.
2. On your turn you pick **which height** to strike (`impactY`, 0–1) and **how hard**
   (`power`, 0–100) — the client sends both; the server (`performSlam`) is authoritative.
3. Power = how far the shock reaches through the stack (blast capped below half-height,
   so a centred hit can't clear everything). Pogs near `impactY` flip; `power >= 90` = PERFECT.
4. Special pogs: 🔒 locked only flips on a strong hit (power ≥ 70 or PERFECT); 💣 bomb
   chain-flips pogs within 0.11 ny (and into other bombs).
5. Scoring is **points**: legendary pogs = 2pts, others = 1; a 3+ streak ("on fire")
   widens the blast and multiplies points ×1.5. Flipped pogs go to the slammer's collection.
6. Game ends when the stack is empty; higher points wins.

The browser-only `demo.html` reimplements this client-side (no server) and adds the
single-player gauntlet + unlockable slammers. Keep the core constants in `performSlam`
and demo's `doSlam` in sync.

### Database Schema

Single `players` table:
- `id`, `username`, `password_hash`
- `pog_inventory` (JSON string of pog IDs)
- `refill_count` (tracks inventory resets)

## Key Implementation Details

- Room state is in-memory only (lost on server restart)
- Slam is server-authoritative: client sends `slam { roomId, power, impactY }`; the
  server computes which pogs flip (clamps inputs, so a tampered client can't cheat
  the outcome beyond choosing aim + power)
- `slamResult` carries `{ impactY, blast, perfect, accuracy, points, bombTriggered,
  onFire, flippedPogs, slammer, streak }` so both clients animate identically
- CPU opponent auto-slams after ~1.4s, aiming near the cluster centroid with error
- Pog images come from CoinGecko API URLs (roster + rarity tiers in `coins.js`)
- User needs minimum 6 pogs to join a game; initial inventory is 12 random pog IDs
