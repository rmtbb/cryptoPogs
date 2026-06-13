# Server

The main backend server (`server.js`) handles multiplayer game logic and user authentication.

## Core Responsibilities

1. **Static File Serving**: Serves HTML/CSS/JS via Express
2. **WebSocket Handling**: Socket.io for real-time multiplayer
3. **Game Logic**: Slam mechanics, turn management, scoring
4. **Room Management**: Create/join/list game rooms
5. **Authentication**: User login/register via database
6. **Inventory Management**: Track user pog collections

## Key Functions

### `initializeGame(room)`
Sets up a new game:
- Each player contributes 6 random pogs from inventory
- Shuffles combined stack
- Stores original state for results tracking

### `performSlam(room)`
Executes a slam action:
- 50% random chance for each pog to flip face-up
- Collects face-up pogs for current player
- Updates scores
- Removes collected from stack
- Shuffles remaining pogs

### `handleGameOver(room)`
Finalizes a game:
- Determines winner
- Sets loser as next game starter
- Updates database inventories
- Emits gameOver event

### `checkCpuTurn(room)`
CPU AI for single-player mode:
- 1.5 second delay for "thinking"
- Automatically performs slam when CPU's turn

## Room Storage

Rooms are stored in-memory in the `rooms` object:
```javascript
const rooms = {};  // Key: roomId, Value: room state
```

This means rooms are lost on server restart.

## Port Configuration

Default port 3000, configurable via `PORT` environment variable.

## Related Articles

- [[database]]
- [[game-state]]
- [[data-flow]]
