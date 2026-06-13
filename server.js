const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const db = require('./database');
const { COIN_POOL, getCoin } = require('./coins');

// Initialize Database
db.initDB();

// Serve static files from the current directory
app.use(express.static(__dirname));

// Game State Storage (in memory for simplicity)
const rooms = {};

// Helper to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Convert a slam "power" (0-100) into a per-pog flip chance.
// Higher power = more flips. The top of the bar is a "PERFECT" zone that pays
// out big — that's the skill/tension hook. Marker moves fast so nailing it matters.
function powerToChance(power) {
    const p = Math.max(0, Math.min(100, Number(power) || 0));
    const perfect = p >= 90;
    const chance = perfect ? 0.92 : 0.20 + 0.62 * (p / 100); // 0.20 .. ~0.82, 0.92 on perfect
    return { chance, perfect, power: p };
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // --- Auth Events ---
    socket.on('register', async ({ username, password }) => {
        try {
            const user = await db.createUser(username, password);
            socket.user = user;
            socket.emit('authSuccess', publicUser(user));
        } catch (err) {
            socket.emit('authError', 'Registration failed: ' + err.message);
        }
    });

    socket.on('login', async ({ username, password }) => {
        try {
            const user = await db.loginUser(username, password);
            socket.user = user;
            socket.emit('authSuccess', publicUser(user));
        } catch (err) {
            socket.emit('authError', 'Login failed: ' + err.message);
        }
    });

    socket.on('refill', async () => {
        if (!socket.user) return;
        try {
            const newPogs = await db.refillPogs(socket.user.id);
            socket.user.pogs = newPogs;
            const updatedUser = await db.getUser(socket.user.id);
            socket.user = updatedUser;
            socket.emit('inventoryUpdate', publicUser(updatedUser));
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

        if (socket.user.pogs.length < 6) {
            socket.emit('errorMsg', 'Not enough pogs! Need 6. Please refill.');
            return;
        }

        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = newRoom(roomId);
        }

        const room = rooms[roomId];

        if (room.players.length >= 2) {
            socket.emit('errorMsg', 'Room is full');
            return;
        }

        if (room.players.find(p => p.id === socket.id)) return;

        const playerNum = room.players.length + 1;
        room.players.push({
            id: socket.id,
            userId: socket.user.id,
            name: socket.user.username,
            num: playerNum,
            inventory: [...socket.user.pogs]
        });

        io.to(roomId).emit('updateRoom', {
            id: roomId,
            players: room.players,
            state: room.gameState
        });

        if (room.players.length === 2 && room.gameState === 'waiting') {
            room.gameState = 'playing';
            initializeGame(room);
            io.to(roomId).emit('gameStart', getPublicGameState(room));
        } else if (room.gameState === 'playing') {
            socket.emit('gameStateUpdate', getPublicGameState(room));
        }

        broadcastRoomList();
    });

    socket.on('getRooms', () => {
        socket.emit('roomList', getOpenRooms());
    });

    socket.on('startPvC', async () => {
        if (!socket.user) {
            socket.emit('errorMsg', 'You must be logged in to play.');
            return;
        }

        try {
            const freshUser = await db.getUser(socket.user.id);
            if (freshUser) socket.user = freshUser;
        } catch (e) { }

        if (socket.user.pogs.length < 6) {
            socket.emit('errorMsg', 'Not enough pogs! Need 6.');
            return;
        }

        const roomId = 'cpu_' + socket.id;
        socket.join(roomId);

        if (rooms[roomId]) delete rooms[roomId];

        rooms[roomId] = newRoom(roomId);
        rooms[roomId].gameState = 'playing';
        rooms[roomId].isPvC = true;

        const room = rooms[roomId];

        room.players.push({
            id: socket.id,
            userId: socket.user.id,
            name: socket.user.username,
            num: 1,
            inventory: [...socket.user.pogs]
        });

        // CPU inventory drawn from the pool
        const cpuInventory = [];
        for (let i = 0; i < 12; i++) {
            cpuInventory.push(COIN_POOL[Math.floor(Math.random() * COIN_POOL.length)].id);
        }

        room.players.push({
            id: 'cpu',
            name: 'CPU',
            num: 2,
            inventory: cpuInventory
        });

        initializeGame(room);
        io.to(roomId).emit('gameStart', getPublicGameState(room));
    });

    socket.on('slam', (payload) => {
        // Backwards compatible: payload may be just a roomId string or { roomId, power }
        const roomId = typeof payload === 'string' ? payload : payload.roomId;
        const power = typeof payload === 'string' ? 70 : payload.power;

        const room = rooms[roomId];
        if (!room || room.gameState !== 'playing') return;

        const currentPlayer = room.players[room.turnIndex];
        if (socket.id !== currentPlayer.id) return;

        const results = performSlam(room, power);
        io.to(roomId).emit('slamResult', results);

        if (room.pogs.length === 0) {
            handleGameOver(room);
        } else {
            room.turnIndex = (room.turnIndex + 1) % 2;
            io.to(roomId).emit('gameStateUpdate', getPublicGameState(room));
            checkCpuTurn(room);
        }
    });

    socket.on('restartGame', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        room.gameState = 'playing';
        room.turnIndex = room.nextStarter !== 0 ? room.nextStarter - 1 : 0;
        room.p1Score = 0;
        room.p2Score = 0;
        room.p1Collected = [];
        room.p2Collected = [];
        initializeGame(room);
        io.to(roomId).emit('gameStart', getPublicGameState(room));
        checkCpuTurn(room);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(roomId).emit('playerLeft', socket.id);
                if (room.players.length === 0 || room.isPvC) {
                    delete rooms[roomId];
                }
                break;
            }
        }
        broadcastRoomList();
    });
});

function newRoom(roomId) {
    return {
        id: roomId,
        players: [],
        gameState: 'waiting',
        turnIndex: 0,
        nextStarter: 0,
        pogs: [],
        originalPogs: [],
        p1Score: 0,
        p2Score: 0,
        p1Collected: [],
        p2Collected: []
    };
}

function publicUser(user) {
    return {
        username: user.username,
        pogs: user.pogs,
        refillCount: user.refillCount,
        wins: user.wins,
        losses: user.losses
    };
}

function initializeGame(room) {
    const p1 = room.players.find(p => p.num === 1);
    const p2 = room.players.find(p => p.num === 2);

    const p1Ids = [...p1.inventory];
    const p2Ids = [...p2.inventory];

    shuffleArray(p1Ids);
    shuffleArray(p2Ids);

    const p1Contrib = p1Ids.slice(0, 6);
    const p2Contrib = p2Ids.slice(0, 6);

    const compiledPogs = [];

    p1Contrib.forEach((id, i) => {
        compiledPogs.push({ id: i, owner: 1, coin: getCoin(id), faceUp: false });
    });
    p2Contrib.forEach((id, i) => {
        compiledPogs.push({ id: i + 6, owner: 2, coin: getCoin(id), faceUp: false });
    });

    shuffleArray(compiledPogs);
    room.pogs = compiledPogs;
    room.originalPogs = JSON.parse(JSON.stringify(compiledPogs));
}

function performSlam(room, power) {
    const { chance, perfect, power: clamped } = powerToChance(power);

    room.pogs.forEach(p => {
        p.faceUp = Math.random() < chance;
    });

    const faceUpPogs = room.pogs.filter(p => p.faceUp);
    const count = faceUpPogs.length;
    const currentTurnPlayerNum = room.turnIndex + 1;

    if (count > 0) {
        if (currentTurnPlayerNum === 1) {
            room.p1Score += count;
            faceUpPogs.forEach(p => { p.collectedBy = 1; room.p1Collected.push(p); });
        } else {
            room.p2Score += count;
            faceUpPogs.forEach(p => { p.collectedBy = 2; room.p2Collected.push(p); });
        }
    }

    room.pogs = room.pogs.filter(p => !p.faceUp);
    if (room.pogs.length > 0) shuffleArray(room.pogs);

    return {
        flippedCount: count,
        flippedPogs: faceUpPogs,
        slammer: currentTurnPlayerNum,
        power: clamped,
        perfect: perfect && count > 0,
        remaining: room.pogs.length
    };
}

function getPublicGameState(room) {
    return {
        id: room.id,
        players: room.players,
        turnIndex: room.turnIndex,
        pogs: room.pogs,
        p1Score: room.p1Score,
        p2Score: room.p2Score,
        p1Collected: room.p1Collected,
        p2Collected: room.p2Collected,
        originalPogs: room.originalPogs
    };
}

function getOpenRooms() {
    const openRooms = [];
    for (const id in rooms) {
        if (!rooms[id].isPvC && rooms[id].gameState === 'waiting' && rooms[id].players.length < 2) {
            openRooms.push({ id: id, playerCount: rooms[id].players.length });
            if (openRooms.length >= 6) break;
        }
    }
    return openRooms;
}

function checkCpuTurn(room) {
    if (!room.isPvC || room.gameState !== 'playing') return;

    const currentPlayer = room.players[room.turnIndex];
    if (currentPlayer.id === 'cpu') {
        setTimeout(() => {
            if (room.gameState !== 'playing') return;

            // CPU "skill": usually a solid slam, occasionally a perfect one.
            const roll = Math.random();
            let cpuPower;
            if (roll < 0.18) cpuPower = 90 + Math.random() * 10;   // perfect
            else cpuPower = 45 + Math.random() * 40;               // 45-85

            const results = performSlam(room, cpuPower);
            io.to(room.id).emit('slamResult', results);

            if (room.pogs.length === 0) {
                handleGameOver(room);
            } else {
                room.turnIndex = (room.turnIndex + 1) % 2;
                io.to(room.id).emit('gameStateUpdate', getPublicGameState(room));
            }
        }, 1400);
    }
}

function handleGameOver(room) {
    room.gameState = 'ended';

    let winner = room.p1Score > room.p2Score ? 1 : (room.p2Score > room.p1Score ? 2 : 0);
    if (winner === 1) room.nextStarter = 2;
    else if (winner === 2) room.nextStarter = 1;
    else room.nextStarter = Math.random() < 0.5 ? 1 : 2;

    const p1 = room.players.find(p => p.num === 1);
    const p2 = room.players.find(p => p.num === 2);

    // Persist inventories + W/L for human players.
    [p1, p2].forEach(pl => {
        if (!pl || !pl.userId) return; // skip CPU
        const collected = pl.num === 1 ? room.p1Collected : room.p2Collected;
        const invIds = collected.map(p => p.coin.id);
        db.updateInventory(pl.userId, invIds);
        if (winner !== 0) db.recordResult(pl.userId, winner === pl.num);

        const s = io.sockets.sockets.get(pl.id);
        if (s && s.user) {
            s.user.pogs = invIds;
            db.getUser(pl.userId).then(u => { if (u) s.emit('inventoryUpdate', publicUser(u)); });
        }
    });

    io.to(room.id).emit('gameOver', {
        winner: winner,
        p1Score: room.p1Score,
        p2Score: room.p2Score,
        finalState: getPublicGameState(room)
    });
}

function broadcastRoomList() {
    io.emit('roomList', getOpenRooms());
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
