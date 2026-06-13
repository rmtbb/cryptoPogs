# Data Flow

## Game Initialization Flow

```
1. User loads page
2. Socket.io connects to server
3. User authenticates (login/register)
4. Server returns user data + pog inventory
5. User joins/creates room OR starts PvC
6. Server initializes game state
7. Both players receive gameStart event
```

## Gameplay Loop

```
1. Server determines current player (turnIndex)
2. Active player clicks "Slam!"
3. Client emits 'slam' event
4. Server:
   - Randomly flips each pog (50% chance face-up)
   - Collects face-up pogs for current player
   - Updates scores
   - Shuffles remaining pogs
5. Server emits 'slamResult' to room
6. Client animates collected pogs flying to sidebar
7. Server emits 'gameStateUpdate' with new state
8. Turn passes to other player
9. Repeat until stack is empty
10. Server emits 'gameOver' with winner
```

## Socket Events

### Client -> Server
- `register` / `login` - Authentication
- `joinRoom` - Join multiplayer room
- `startPvC` - Start CPU game
- `slam` - Execute slam action
- `restartGame` - Play again
- `getRooms` - Fetch room list
- `refill` - Refill pog inventory

### Server -> Client
- `authSuccess` / `authError` - Auth results
- `updateRoom` - Room state changed
- `gameStart` - Game beginning
- `gameStateUpdate` - State changed
- `slamResult` - Slam outcome
- `gameOver` - Game ended
- `roomList` - Available rooms
- `inventoryUpdate` - Pogs changed

## Related Articles

- [[server]]
- [[game-client]]
- [[game-state]]
