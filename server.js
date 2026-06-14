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

const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

// Each pog gets a normalized (nx, ny) position in the "pile". A slam picks an
// impact point (impactX) + power; pogs within the blast radius flip, closer =
// more likely. Aiming at the thickest cluster + a strong/PERFECT slam is the skill.
function scatterPos() {
    return {
        nx: clampN(0.5 + (Math.random() - 0.5) * 0.80, 0.1, 0.9),
        ny: clampN(0.5 + (Math.random() - 0.5) * 0.60, 0.22, 0.78)
    };
}

function centroidX(pogs) {
    return pogs.length ? pogs.reduce((s, p) => s + p.nx, 0) / pogs.length : 0.5;
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
        // payload: { roomId, power, impactX } (string roomId tolerated for safety)
        const roomId = typeof payload === 'string' ? payload : payload.roomId;
        const power = typeof payload === 'string' ? 70 : payload.power;
        const impactX = typeof payload === 'string' ? 0.5 : payload.impactX;

        const room = rooms[roomId];
        if (!room || room.gameState !== 'playing') return;

        const currentPlayer = room.players[room.turnIndex];
        if (socket.id !== currentPlayer.id) return;

        const results = performSlam(room, power, impactX);
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
        room.streak = { 1: 0, 2: 0 };
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
        p2Collected: [],
        streak: { 1: 0, 2: 0 }
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
        const s = scatterPos();
        compiledPogs.push({ id: i, owner: 1, coin: getCoin(id), faceUp: false, nx: s.nx, ny: s.ny });
    });
    p2Contrib.forEach((id, i) => {
        const s = scatterPos();
        compiledPogs.push({ id: i + 6, owner: 2, coin: getCoin(id), faceUp: false, nx: s.nx, ny: s.ny });
    });

    // No shuffle: each pog's (nx, ny) defines the layout you aim into.
    room.pogs = compiledPogs;
    room.originalPogs = JSON.parse(JSON.stringify(compiledPogs));
    room.streak = { 1: 0, 2: 0 };
}

// Authoritative slam: (power 0-100, impactX 0-1) -> which pogs flip.
// Power sets blast radius + strength; pogs within the blast flip (closer = more
// likely). A 3+ slam streak goes "on fire" and widens the blast.
function performSlam(room, power, impactX) {
    if (!room.streak) room.streak = { 1: 0, 2: 0 };
    const p = clampN(Number(power) || 0, 0, 100);
    const perfect = p >= 90;
    const slammerNum = room.turnIndex + 1;

    let blast = 0.12 + 0.26 * (p / 100);
    if (perfect) blast += 0.10;
    if (room.streak[slammerNum] >= 3) blast += 0.06;
    let baseChance = 0.42 + 0.45 * (p / 100);
    if (perfect) baseChance = 0.95;

    const ix = clampN(Number(impactX), 0, 1);
    const cx = centroidX(room.pogs);
    const aimErr = Math.abs(ix - cx);
    const accuracy = aimErr < 0.09 ? 'bullseye' : (aimErr < 0.2 ? 'close' : 'off');

    room.pogs.forEach(pog => {
        const dx = pog.nx - ix;
        const dy = (pog.ny - 0.5) * 0.55;
        const d = Math.sqrt(dx * dx + dy * dy);
        const chance = d <= blast ? baseChance * (1 - (d / blast) * 0.55) : 0.05;
        pog.faceUp = Math.random() < chance;
    });

    const faceUpPogs = room.pogs.filter(p => p.faceUp);
    const count = faceUpPogs.length;

    if (count > 0) {
        if (slammerNum === 1) {
            room.p1Score += count;
            faceUpPogs.forEach(p => { p.collectedBy = 1; room.p1Collected.push(p); });
        } else {
            room.p2Score += count;
            faceUpPogs.forEach(p => { p.collectedBy = 2; room.p2Collected.push(p); });
        }
        room.streak[slammerNum]++;
    } else {
        room.streak[slammerNum] = 0;
    }

    room.pogs = room.pogs.filter(p => !p.faceUp);

    return {
        flippedCount: count,
        flippedPogs: faceUpPogs,
        slammer: slammerNum,
        power: Math.round(p),
        impactX: ix,
        blast,
        perfect: perfect && count > 0,
        accuracy,
        streak: room.streak[slammerNum],
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
        originalPogs: room.originalPogs,
        streak: room.streak || { 1: 0, 2: 0 }
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

            // CPU "skill": aim near the cluster centroid (with some error),
            // usually a solid slam, occasionally a perfect one.
            const cx = centroidX(room.pogs);
            const impactX = clampN(cx + (Math.random() - 0.5) * 0.22, 0.1, 0.9);
            const roll = Math.random();
            const cpuPower = roll < 0.15 ? (90 + Math.random() * 10) : (50 + Math.random() * 38);

            const results = performSlam(room, cpuPower, impactX);
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
