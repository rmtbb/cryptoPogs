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
- `slam` - Player action during game
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
  pogs: [...],         // Current stack (shuffled pool of 12)
  p1Collected: [...],  // Pogs won by player 1
  p2Collected: [...],  // Pogs won by player 2
  turnIndex: 0|1,      // Whose turn
  isPvC: boolean       // CPU game flag
}
```

### Game Flow
1. Each player contributes 6 pogs from their inventory
2. Combined 12 pogs are shuffled into a stack
3. Players alternate "slamming" - each pog has 50% chance to flip face-up
4. Face-up pogs go to the slammer's collection
5. Remaining pogs are reshuffled
6. Game ends when stack is empty; winner has more collected pogs

### Database Schema

Single `players` table:
- `id`, `username`, `password_hash`
- `pog_inventory` (JSON string of pog IDs)
- `refill_count` (tracks inventory resets)

## Key Implementation Details

- Room state is in-memory only (lost on server restart)
- CPU opponent auto-slams after 1.5s delay
- Pog images come from CoinGecko API URLs with fallback data
- User needs minimum 6 pogs to join a game
- Initial inventory is 12 random crypto pog IDs
