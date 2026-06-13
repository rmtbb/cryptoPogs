# State Management Gotchas

## Animation Blocking State Updates

### Issue
When pogs fly to the sidebar during collection animation, state updates from the server arrive before the animation completes.

### Solution
The client uses an animation queue:
```javascript
let isAnimating = false;
let pendingState = null;

socket.on('gameStateUpdate', (gameState) => {
  if (isAnimating) {
    pendingState = gameState;
  } else {
    renderGameState(gameState);
  }
});
```

After animation completes, pending state is applied.

## In-Memory Room Storage

### Issue
All game rooms are stored in server memory:
```javascript
const rooms = {};
```

This means:
- Rooms are lost on server restart
- No persistence of active games
- Memory grows with active rooms

### Mitigation
CPU rooms are prefixed with `cpu_` + socket ID and cleaned up on disconnect.

## CPU Player Identity

### Issue
In PvC mode, the human player's `myPlayerNum` may not be set correctly on game start.

### Solution
Server explicitly syncs player identity in gameStart event:
```javascript
const me = gameState.players.find(p => p.id === socket.id);
if (me) {
  myPlayerNum = me.num;
}
```

## Related Articles

- [[data-flow]]
- [[game-client]]
