const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const db = require('./database');

// Initialize Database
db.initDB();

// Serve static files from the current directory

app.use(express.static(__dirname));

// Game State Storage (in memory for simplicity)
const rooms = {};

const FALLBACK_CRYPTO_DATA = [
    { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
    { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
    { id: "dogecoin", symbol: "doge", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png" },
    { id: "cardano", symbol: "ada", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/large/cardano.png" },
    { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
    { id: "polkadot", symbol: "dot", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png" },
    { id: "uniswap", symbol: "uni", name: "Uniswap", image: "https://assets.coingecko.com/coins/images/12504/large/uniswap.png" },
    { id: "chainlink", symbol: "link", name: "Chainlink", image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png" },
    { id: "litecoin", symbol: "ltc", name: "Litecoin", image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png" },
    { id: "ripple", symbol: "xrp", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png" },
    { id: "binancecoin", symbol: "bnb", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" },
    { id: "tether", symbol: "usdt", name: "Tether", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png" }
];

// Helper to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // --- Auth Events ---
    socket.on('register', async ({ username, password }) => {
        try {
            const user = await db.createUser(username, password);
            socket.user = user;
            socket.emit('authSuccess', { username: user.username, pogs: user.pogs, refillCount: user.refillCount });
        } catch (err) {
            socket.emit('authError', 'Registration failed: ' + err.message);
        }
    });

    socket.on('login', async ({ username, password }) => {
        try {
            const user = await db.loginUser(username, password);
            socket.user = user;
            socket.emit('authSuccess', { username: user.username, pogs: user.pogs, refillCount: user.refillCount });
        } catch (err) {
            socket.emit('authError', 'Login failed: ' + err.message);
        }
    });

    socket.on('refill', async () => {
        if (!socket.user) return;
        try {
            const newPogs = await db.refillPogs(socket.user.id);
            socket.user.pogs = newPogs;
            // Also update local refill count if we tracked it in memory object, but easiest to re-fetch or increment
            const updatedUser = await db.getUser(socket.user.id);
            socket.user.refillCount = updatedUser.refillCount;

            socket.emit('inventoryUpdate', { pogs: newPogs, refillCount: updatedUser.refillCount });
        } catch (err) {
            socket.emit('errorMsg', 'Refill failed');
        }
    });

    socket.on('joinRoom', async (roomId) => {
        if (!socket.user) {
            socket.emit('errorMsg', 'You must be logged in to play.');
            return;
        }

        // Refresh user data from DB to ensure latest pogs
        try {
            const freshUser = await db.getUser(socket.user.id);
            if (freshUser) socket.user = freshUser;
        } catch (e) { console.error(e); }

        // Check if player has enough pogs to play (need at least 1? or 6?)
        // Game logic currently distributes 6 each, so let's req 6.
        if (socket.user.pogs.length < 6) {
            socket.emit('errorMsg', 'Not enough pogs! Need 6. Please refill.');
            return;
        }

        // Leave previous room if any

        // (Simplification: assuming one room per socket for now)

        socket.join(roomId);

        if (!rooms[roomId]) {
            // Create new room
            rooms[roomId] = {
                id: roomId,
                players: [],
                gameState: 'waiting', // waiting, playing, ended
                turnIndex: 0,
                nextStarter: 0, // 0 = random/default, 1 or 2 specific
                pogs: [],

                originalPogs: [],
                p1Score: 0,
                p2Score: 0,
                p1Collected: [],
                p2Collected: [],
                cryptoData: FALLBACK_CRYPTO_DATA // Still used for metadata lookup (images etc)
            };
        }

        const room = rooms[roomId];

        if (room.players.length >= 2) {
            socket.emit('errorMsg', 'Room is full');
            return;
        }

        // Prevent joining same room twice
        if (room.players.find(p => p.id === socket.id)) return;

        // Add player
        const playerNum = room.players.length + 1;
        room.players.push({
            id: socket.id,
            userId: socket.user.id, // DB ID
            name: socket.user.username,
            num: playerNum,
            inventory: [...socket.user.pogs] // Copy inventory
        });
        // Notify room
        io.to(roomId).emit('updateRoom', {
            players: room.players,
            state: room.gameState
        });

        // Start game if 2 players joined
        if (room.players.length === 2 && room.gameState === 'waiting') {
            room.gameState = 'playing';
            initializeGame(room);
            io.to(roomId).emit('gameStart', getPublicGameState(room));
        } else if (room.gameState === 'playing') {
            // Reconnect logic or observer (simplified: just send current state)
            socket.emit('gameStateUpdate', getPublicGameState(room));
        }

        broadcastRoomList();
    });

    socket.on('getRooms', () => {
        socket.emit('roomList', getOpenRooms());
    });


    socket.on('slam', (roomId) => {
        const room = rooms[roomId];
        if (!room || room.gameState !== 'playing') return;

        // Check if it's this player's turn
        const currentPlayer = room.players[room.turnIndex];
        if (socket.id !== currentPlayer.id) return;

        // Perform Slam Logic
        const results = performSlam(room);

        // Broadcast outcome
        io.to(roomId).emit('slamResult', results);

        // Update turn or end game
        if (room.pogs.length === 0) {
            room.gameState = 'ended';

            let winner = room.p1Score > room.p2Score ? 1 : (room.p2Score > room.p1Score ? 2 : 0);
            // Loser starts next game
            if (winner === 1) room.nextStarter = 2;
            else if (winner === 2) room.nextStarter = 1;
            else room.nextStarter = Math.random() < 0.5 ? 1 : 2; // Tie

            // Update DB Inventories
            // P1 has p1Collected, P2 has p2Collected
            // But wait, the game logic was:
            // original pogs were removed from stack.
            // collected pogs are what they have NOW.

            // Player 1's new inventory = p1Collected
            // Player 2's new inventory = p2Collected

            const p1 = room.players.find(p => p.num === 1);
            const p2 = room.players.find(p => p.num === 2);

            if (p1 && p1.userId) {
                const p1InvIds = room.p1Collected.map(p => p.coin.id);
                db.updateInventory(p1.userId, p1InvIds);
                // Update socket user cache if connected
                const s1 = io.sockets.sockets.get(p1.id);
                if (s1 && s1.user) {
                    s1.user.pogs = p1InvIds;
                    s1.emit('inventoryUpdate', { pogs: p1InvIds });
                }
            }

            if (p2 && p2.userId) {
                const p2InvIds = room.p2Collected.map(p => p.coin.id);
                db.updateInventory(p2.userId, p2InvIds);
                const s2 = io.sockets.sockets.get(p2.id);
                if (s2 && s2.user) {
                    s2.user.pogs = p2InvIds;
                    s2.emit('inventoryUpdate', { pogs: p2InvIds });
                }
            }

            io.to(roomId).emit('gameOver', {
                winner: winner,
                p1Score: room.p1Score,
                p2Score: room.p2Score,
                finalState: getPublicGameState(room) // contains collected pogs
            });
        } else {
            room.turnIndex = (room.turnIndex + 1) % 2;
            io.to(roomId).emit('gameStateUpdate', getPublicGameState(room));
        }
    });

    socket.on('restartGame', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        // Simple restart logic: reset state but keep players
        room.gameState = 'playing';

        // Loser starts next round (if set), otherwise P1 (or logic from before)
        if (room.nextStarter !== 0) {
            room.turnIndex = room.nextStarter - 1; // 1-based to 0-based
        } else {
            room.turnIndex = 0;
        }

        room.p1Score = 0;

        room.p2Score = 0;
        room.p1Collected = [];
        room.p2Collected = [];
        initializeGame(room);
        io.to(roomId).emit('gameStart', getPublicGameState(room));
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Cleanup logic: remove player from room, delete room if empty, etc.
        // For this MVP, we might just let the other player know
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(roomId).emit('playerLeft', socket.id);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
    });
});

function initializeGame(room) {
    const p1 = room.players.find(p => p.num === 1);
    const p2 = room.players.find(p => p.num === 2);

    // Logic: each player contributes 6 pogs from their inventory
    // If they have > 6, choose random 6? Or first 6? Random is better.

    const p1Ids = p1.inventory;
    const p2Ids = p2.inventory;

    // Shuffle their personal stacks to pick random contributors
    shuffleArray(p1Ids);
    shuffleArray(p2Ids);

    const p1Contrib = p1Ids.slice(0, 6);
    const p2Contrib = p2Ids.slice(0, 6);

    // Need to map IDs back to full coin objects (metadata)
    // We'll search in FALLBACK_CRYPTO_DATA for now since that's what we have
    const getCoinData = (id) => {
        let c = room.cryptoData.find(x => x.id === id);
        if (!c) {
            // If not found (e.g. from older fallback list), try to find ANY match or use default
            c = room.cryptoData.find(x => x.id === 'bitcoin'); // Fallback
        }
        return c;
    };

    const compiledPogs = [];

    p1Contrib.forEach((id, i) => {
        compiledPogs.push({
            id: i,
            owner: 1,
            coin: getCoinData(id),
            faceUp: false
        });
    });

    p2Contrib.forEach((id, i) => {
        compiledPogs.push({
            id: i + 6,
            owner: 2,
            coin: getCoinData(id),
            faceUp: false
        });
    });

    shuffleArray(compiledPogs);
    room.pogs = compiledPogs;
    room.originalPogs = JSON.parse(JSON.stringify(compiledPogs));
}

function performSlam(room) {
    // Logic from client-side migrated here
    room.pogs.forEach(p => {
        p.faceUp = Math.random() < 0.5;
    });

    const faceUpPogs = room.pogs.filter(p => p.faceUp);
    const count = faceUpPogs.length;

    const currentTurnPlayerNum = room.turnIndex + 1; // 1 or 2

    if (count > 0) {
        if (currentTurnPlayerNum === 1) {
            room.p1Score += count;
            faceUpPogs.forEach(p => {
                p.collectedBy = 1;
                room.p1Collected.push(p);
            });
        } else {
            room.p2Score += count;
            faceUpPogs.forEach(p => {
                p.collectedBy = 2;
                room.p2Collected.push(p);
            });
        }
    }

    // Remove collected
    room.pogs = room.pogs.filter(p => !p.faceUp);

    // Shuffle remaining (Our fix!)
    if (room.pogs.length > 0) {
        shuffleArray(room.pogs);
    }

    return {
        flippedCount: count,
        flippedPogs: faceUpPogs,
        slammer: currentTurnPlayerNum
    };
}

function getPublicGameState(room) {
    return {
        players: room.players,
        turnIndex: room.turnIndex,
        pogs: room.pogs, // Current stack
        p1Score: room.p1Score,
        p2Score: room.p2Score,
        p1Collected: room.p1Collected,
        p2Collected: room.p2Collected,
        originalPogs: room.originalPogs
    };
}

function getOpenRooms() {
    // Return first 3 waiting rooms
    const openRooms = [];
    for (const id in rooms) {
        if (rooms[id].gameState === 'waiting' && rooms[id].players.length < 2) {
            openRooms.push({ id: id, playerCount: rooms[id].players.length });
            if (openRooms.length >= 3) break;
        }
    }
    return openRooms;
}

function broadcastRoomList() {
    io.emit('roomList', getOpenRooms());
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
