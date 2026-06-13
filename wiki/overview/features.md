# Features

## Core Gameplay
- **Slam Mechanic**: Players take turns slamming a stack of pogs; face-up pogs are collected
- **Turn-Based Play**: Alternating turns between two players
- **Score Tracking**: Real-time score display during gameplay
- **Winner Determination**: Player with most collected pogs wins

## Multiplayer
- **Room System**: Create or join named game rooms
- **Real-time Sync**: Socket.io-powered game state synchronization
- **Player Lobby**: See available rooms and player counts
- **PvC Mode**: Single-player mode against CPU opponent

## Pog Management
- **Inventory System**: Players own a collection of pog IDs
- **Contribution**: Each player contributes 6 pogs per game
- **Stake Tracking**: Original ownership tracked for results summary
- **Refill System**: Players can refill their pog collection (tracked)

## Visual Features
- **Animated Pogs**: Flying pog animations when collected
- **3D Stack**: Perspective-based pog stack rendering
- **Crypto Images**: Live cryptocurrency logos from CoinGecko
- **Responsive Design**: Mobile-friendly UI

## Authentication
- **Wallet-Based Auth**: Solana/Phantom wallet authentication (planned)
- **Username/Password**: Current implementation uses traditional auth
- **Persistent Inventory**: SQLite database stores user pogs

## Related Articles

- [[game-client]]
- [[server]]
- [[database]]
