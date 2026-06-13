# Game Client

The game client (`pogsthegame.html`) is the main gameplay interface.

## Structure

Single HTML file containing:
- Lobby overlay (login/room selection)
- Game board with pog stack
- Player sidebars showing contributed/collected pogs
- Scoreboard

## UI Components

### Lobby Overlay
- Login/Register forms
- User info bar (pog count, refill button)
- Room list with join buttons
- Single Player and Create Room buttons

### Game Area
- Central pog stack with 3D perspective
- Slam button (active player only)
- Turn indicator message
- Restart button (after game ends)

### Player Sidebars
- Player names
- Contributed pogs (at game start)
- Collected pogs (won during game)

## Client State

```javascript
let currentUser = null;      // Logged-in user data
let pendingAction = null;    // Action waiting for auth
let isGameActive = false;    // Game in progress
let myPlayerNum = 0;         // 1 or 2
let currentRoomId = "";      // Active room
let isAnimating = false;     // Animation in progress
let pendingState = null;     // Queued state update
```

## Animation System

When pogs are collected, `animateCollection()`:
1. Clones pog elements
2. Calculates flight path to sidebar
3. Applies CSS transition (0.8s)
4. Scales down + rotates 720 degrees
5. Removes clone on completion
6. Queues state updates during animation

## CSS Design

- Dark theme with purple/green accents
- CSS custom properties for theming
- 3D transforms for pog stack
- Hover effects with scale/rotation
- Responsive layout for mobile

## Related Articles

- [[data-flow]]
- [[server]]
- [[features]]
