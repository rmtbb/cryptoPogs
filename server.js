const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId, playerName) => {
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
        pogs: [],
        originalPogs: [],
        p1Score: 0,
        p2Score: 0,
        p1Collected: [],
        p2Collected: [],
        cryptoData: FALLBACK_CRYPTO_DATA
      };
    }

    const room = rooms[roomId];

    if (room.players.length >= 2) {
      socket.emit('errorMsg', 'Room is full');
      return;
    }

    // Add player
    const playerNum = room.players.length + 1;
    room.players.push({
      id: socket.id,
      name: playerName || `Player ${playerNum}`,
      num: playerNum
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
      io.to(roomId).emit('gameOver', {
        winner: room.p1Score > room.p2Score ? 1 : (room.p2Score > room.p1Score ? 2 : 0),
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
      if(!room) return;
      
      // Simple restart logic: reset state but keep players
      room.gameState = 'playing';
      room.turnIndex = 0;
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
  // Use fallback data for now to ensure reliability, 
  // in production we could fetch real data here too.
  const chosen = [];
  const totalPogs = 12;
  const data = room.cryptoData;
  
  // Pick random unique
  const used = new Set();
  while(chosen.length < totalPogs && chosen.length < data.length) {
    let idx = Math.floor(Math.random() * data.length);
    if(!used.has(idx)) {
      used.add(idx);
      chosen.push(data[idx]);
    }
  }

  // Assign owners
  const compiledPogs = [];
  // First 6 for P1
  for(let i=0; i<6; i++) {
    compiledPogs.push({
      id: i,
      owner: 1,
      coin: chosen[i],
      faceUp: false
    });
  }
  // Next 6 for P2
  for(let i=6; i<12; i++) {
    compiledPogs.push({
      id: i,
      owner: 2,
      coin: chosen[i],
      faceUp: false
    });
  }

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
