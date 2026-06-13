# Game State

The game state object is the central data structure that tracks all aspects of an active game.

## Room Object Structure

```javascript
{
  id: string,           // Room identifier
  players: Player[],    // Array of 2 players
  gameState: string,    // 'waiting' | 'playing' | 'ended'
  turnIndex: number,    // 0 or 1 (index into players array)
  nextStarter: number,  // Who starts next game (loser)
  pogs: Pog[],          // Current stack
  originalPogs: Pog[],  // Initial state for results
  p1Score: number,
  p2Score: number,
  p1Collected: Pog[],
  p2Collected: Pog[],
  cryptoData: CoinData[], // Metadata for pog images
  isPvC: boolean        // True if CPU game
}
```

## Player Object

```javascript
{
  id: string,          // socket.id or 'cpu'
  userId: number,      // Database ID (null for CPU)
  name: string,        // Display name
  num: number,         // 1 or 2
  inventory: string[]  // Array of coin IDs
}
```

## Pog Object

```javascript
{
  id: number,          // Unique ID (0-11)
  owner: number,       // Original owner (1 or 2)
  coin: CoinData,      // Crypto metadata
  faceUp: boolean,     // Current flip state
  collectedBy: number  // Who collected (after slam)
}
```

## CoinData Object

```javascript
{
  id: string,     // "bitcoin", "ethereum", etc.
  symbol: string, // "btc", "eth", etc.
  name: string,   // "Bitcoin", "Ethereum", etc.
  image: string   // URL to logo
}
```

## Related Articles

- [[server]]
- [[data-flow]]
