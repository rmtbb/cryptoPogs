# 🪙 Crypto Pogs — Stack 'em. Slam 'em. Keep 'em.

![Crypto Pogs](docs/banner.png)

A real-time, online **pog-slamming battle** with a crypto twist. The 90s playground
classic reborn: ante up your coins, charge a skill-based slam, nail the **PERFECT**
zone, and flip your opponent's pogs into your own collection.

🌐 **Landing page:** [cryptopogs.remotebb.com](https://cryptopogs.remotebb.com)

---

## 🎲 Two ways to play

| | **Browser Demo** | **Full Game** |
|---|---|---|
| Play | [cryptopogs.remotebb.com/demo.html](https://cryptopogs.remotebb.com/demo.html) | Run it yourself (below) |
| Mode | Single-player vs CPU | Single-player **+ real-time online multiplayer** |
| Setup | None — runs entirely in your browser | `npm install` + `node server.js` |
| Accounts | Local W/L record (localStorage) | Real accounts, inventories & W/L (SQLite) |

The demo (`demo.html`) is a fully client-side build — no server, no install — great for a quick taste.
The full game (`server.js`) adds account-based play and live head-to-head matches over the web.

---

## ✨ Features

- ⚡ **Real-time multiplayer** — create a room, share the name, slam head-to-head over the web (Socket.IO)
- 🎯 **Skill-based slams** — a timing power meter, not a mindless coin flip. Hit the gold zone for a PERFECT
- 🤖 **Solo vs CPU** — warm up against a CPU that throws its own perfect slams
- 💥 **Pure juice** — screen shake, particle bursts, flying pogs, confetti, and a full WebAudio sound kit
- ✨ **Rarity tiers** — 20 crypto pogs from common → legendary, each with its own glow
- 🏆 **Persistent loot** — accounts, inventories, and win/loss records; what you win, you keep

## 🎮 How to play

Real pogs: a stack sits in a pile on the table, you **throw your slammer down** onto it, and the stack **scatters** — the pogs that land face-up are yours.

1. **Aim** — your slammer sways over the pile; tap to drop it **dead-centre** (the squarest hit flips the most).
2. **Power** — stop the meter in the gold **PERFECT** zone. A square, hard throw scatters most of the stack.
3. **Keep the spoils** — face-up pogs fly to your collection. Hunt gold **2× pogs**, pop 💣 **bombs** (scatter extra pogs), bring power to crack 🔒 **locked** pogs, and chain slams to go 🔥 **on fire** (×1.5 points). Higher score wins.

### Modes (single-player demo)
- **⚔️ Gauntlet** — climb Rookie → Pro → Master → Legend; each tier unlocks the next opponent and a new slammer.
- **⚡ Slam Rush** — endless score-chase; clear the pile for +5, three whiffs ends the run.
- **🗓 Daily Challenge** — the same seeded stack for everyone each day; beat your best, share the score.
- **🥏 Slammers** — 5 unlockable kinis (Heavy, Sniper, Hot Hand, Midas…) with real trade-offs.

The full multiplayer game adds real-time human-vs-human play with the same mechanic.

| In-game | Victory |
|---|---|
| ![Gameplay](docs/screenshot-game.png) | ![Win](docs/screenshot-win.png) |

## 🚀 Run it locally

```bash
git clone https://github.com/rmtbb/cryptoPogs.git
cd cryptoPogs
npm install
node server.js
# → open http://localhost:3000
```

Then open a second browser/tab to play multiplayer, or hit **Single Player** to battle the CPU.

## 🧱 Tech stack

- **Backend:** Node.js, Express 5, Socket.IO 4
- **Database:** SQLite3 (bcrypt password hashing)
- **Frontend:** single-file HTML/CSS/JS with the Socket.IO client — no build step

## 📂 Project layout

| File | Purpose |
|---|---|
| `server.js` | Express + Socket.IO server, game logic, server-authoritative slams |
| `database.js` | SQLite wrapper — auth, inventories, win/loss |
| `coins.js` | Shared crypto-pog roster with rarity tiers |
| `pogsthegame.html` | The game client (UI, animations, sound, power meter) |
| `index.html` | Marketing landing page |

> **Note:** A Solana/token betting economy was prototyped (`solana/`) but is currently
> shelved — the focus is on making the game itself fun. Those deps are dormant.

---

Built for fun. PRs welcome. 🤝
