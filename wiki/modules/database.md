# Database

The database module (`database.js`) handles SQLite persistence for users, matches, and deposits.

## Database File

SQLite database stored at `./pogs_db.sqlite`

## Tables

### players
Stores user accounts and pog inventories.
```sql
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  pog_inventory TEXT DEFAULT '[]',  -- JSON array of coin IDs
  refill_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### matches
Records game matches for betting functionality (future feature).
```sql
CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  player1_wallet TEXT NOT NULL,
  player2_wallet TEXT,
  stake_amount INTEGER DEFAULT 0,
  winner_wallet TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME,
  completed_at DATETIME
)
```

### deposits
Tracks escrow deposits for staked games (future feature).
```sql
CREATE TABLE deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  tx_signature TEXT UNIQUE,
  amount INTEGER NOT NULL,
  match_id INTEGER,
  status TEXT DEFAULT 'pending',
  created_at DATETIME
)
```

## Key Functions

- `getOrCreateUserByWallet(address)` - Auto-creates new users
- `getUserByWallet(address)` - Lookup by wallet
- `getUser(id)` - Lookup by DB ID
- `updateInventory(userId, pogs)` - Save pog collection
- `refillPogs(userId)` - Reset to starter pogs

## Starter Pogs

New users receive 12 default pogs:
```javascript
const STARTER_POGS = [
  "bitcoin", "ethereum", "dogecoin", "cardano",
  "solana", "polkadot", "uniswap", "chainlink",
  "litecoin", "ripple", "binancecoin", "tether"
];
```

## Related Articles

- [[server]]
- [[game-state]]
