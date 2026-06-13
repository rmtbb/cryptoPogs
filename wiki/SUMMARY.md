# Wiki Summary

**Generated**: 2026-05-06

## Project Overview

CryptoPogs is a multiplayer browser game combining nostalgic pogs gameplay with cryptocurrency theming. Players collect, stake, and slam crypto-themed pogs in real-time matches.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite
- **Blockchain**: Solana (token minting scripts)
- **Data**: CoinGecko API for crypto logos/prices

## Wiki Structure

| Topic | Articles | Description |
|-------|----------|-------------|
| overview | 2 | Project description, features |
| architecture | 3 | Tech stack, data flow, game state |
| modules | 5 | Server, database, clients, Solana scripts |
| setup | 2 | Installation, environment vars |
| dependencies | 2 | NPM packages, external APIs |
| assets | 2 | Images, legacy files |
| gotchas | 2 | State management, CORS issues |
| history | 1 | Session summaries |

**Total**: 27 articles across 8 topics

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Game server, Socket.io events, room management |
| `database.js` | SQLite persistence, user/match/deposit tables |
| `pogsthegame.html` | Game client with lobby and gameplay |
| `index.html` | Landing page with crypto pog gallery |

## Entry Point

Start at [[_master-index]] to navigate the wiki.
