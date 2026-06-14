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
- `slam` - Player action: `{ roomId, power, impactX }` (aim + power)
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
  pogs: [...],         // Pile of 12; each pog has { id, owner, coin, faceUp, nx, ny }
  p1Collected: [...],  // Pogs won by player 1
  p2Collected: [...],  // Pogs won by player 2
  turnIndex: 0|1,      // Whose turn
  streak: { 1, 2 },    // Consecutive scoring slams per player (3+ = "on fire")
  isPvC: boolean       // CPU game flag
}
```

### Game Flow (aim + power slam)
1. Each player contributes 6 pogs; combined 12 are scattered into a "pile" — every
   pog gets a normalized `(nx, ny)` position (server-assigned in `initializeGame`).
2. On your turn you pick **where** to slam (`impactX`, 0–1) and **how hard** (`power`,
   0–100) — the client sends both; the server (`performSlam`) is authoritative.
3. Power sets a blast radius + strength. Pogs within the blast flip face-up (closer
   to impact = more likely); `power >= 90` is a PERFECT slam.
4. Face-up pogs go to the slammer's collection and are removed from the pile.
5. A 3+ scoring streak goes "on fire" and widens the blast.
6. Game ends when the pile is empty; whoever collected more pogs wins.

The browser-only `demo.html` reimplements this exact logic client-side (it has no
server); keep the constants in `performSlam` and demo's `doSlam` in sync.

### Database Schema

Single `players` table:
- `id`, `username`, `password_hash`
- `pog_inventory` (JSON string of pog IDs)
- `refill_count` (tracks inventory resets)

## Key Implementation Details

- Room state is in-memory only (lost on server restart)
- Slam is server-authoritative: client sends `slam { roomId, power, impactX }`; the
  server computes which pogs flip (clamps inputs, so a tampered client can't cheat
  the outcome beyond choosing aim + power)
- `slamResult` carries `{ impactX, blast, perfect, accuracy, flippedPogs, slammer,
  streak }` so both clients animate the shockwave + rating identically
- CPU opponent auto-slams after ~1.4s, aiming near the cluster centroid with error
- Pog images come from CoinGecko API URLs (roster + rarity tiers in `coins.js`)
- User needs minimum 6 pogs to join a game; initial inventory is 12 random pog IDs
