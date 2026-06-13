const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const db = new sqlite3.Database('./pogs_db.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

function initDB() {
    db.serialize(() => {
        // Players table - classic username/password auth.
        // (Wallet / token based auth is shelved for now — focus is on the game.)
        db.run(`CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            pog_inventory TEXT DEFAULT '[]',
            refill_count INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Lightweight migrations for older databases (ignore "duplicate column" errors).
        db.run(`ALTER TABLE players ADD COLUMN wins INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE players ADD COLUMN losses INTEGER DEFAULT 0`, () => {});
    });
}

// 12 random crypto pogs to start. Pool defined in coins.js so it stays in sync
// with the server's metadata.
const { COIN_POOL } = require('./coins');
const ALL_IDS = COIN_POOL.map(c => c.id);

function rollStarterPogs() {
    const pogs = [];
    for (let i = 0; i < 12; i++) {
        pogs.push(ALL_IDS[Math.floor(Math.random() * ALL_IDS.length)]);
    }
    return pogs;
}

function rowToUser(row) {
    return {
        id: row.id,
        username: row.username,
        pogs: JSON.parse(row.pog_inventory || '[]'),
        refillCount: row.refill_count || 0,
        wins: row.wins || 0,
        losses: row.losses || 0
    };
}

function createUser(username, password) {
    return new Promise(async (resolve, reject) => {
        username = (username || '').trim();
        if (username.length < 2) return reject(new Error('Username too short'));
        if (!password || password.length < 3) return reject(new Error('Password too short'));

        try {
            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            const starter = rollStarterPogs();
            const stmt = db.prepare("INSERT INTO players (username, password_hash, pog_inventory) VALUES (?, ?, ?)");
            stmt.run(username, hash, JSON.stringify(starter), function (err) {
                if (err) {
                    if (/UNIQUE/.test(err.message)) return reject(new Error('Username already taken'));
                    return reject(err);
                }
                resolve({
                    id: this.lastID,
                    username,
                    pogs: starter,
                    refillCount: 0,
                    wins: 0,
                    losses: 0
                });
            });
            stmt.finalize();
        } catch (e) {
            reject(e);
        }
    });
}

function loginUser(username, password) {
    return new Promise((resolve, reject) => {
        username = (username || '').trim();
        db.get("SELECT * FROM players WHERE username = ?", [username], async (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('No such user'));
            try {
                const ok = await bcrypt.compare(password, row.password_hash);
                if (!ok) return reject(new Error('Wrong password'));
                resolve(rowToUser(row));
            } catch (e) {
                reject(e);
            }
        });
    });
}

function getUser(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM players WHERE id=?", [id], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            resolve(rowToUser(row));
        });
    });
}

function updateInventory(userId, newInventory) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE players SET pog_inventory = ? WHERE id = ?",
            [JSON.stringify(newInventory), userId], function (err) {
                if (err) return reject(err);
                resolve();
            });
    });
}

function recordResult(userId, didWin) {
    return new Promise((resolve, reject) => {
        const col = didWin ? 'wins' : 'losses';
        db.run(`UPDATE players SET ${col} = ${col} + 1 WHERE id = ?`, [userId], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function refillPogs(userId) {
    return new Promise((resolve, reject) => {
        const starter = rollStarterPogs();
        db.run("UPDATE players SET pog_inventory = ?, refill_count = refill_count + 1 WHERE id = ?",
            [JSON.stringify(starter), userId],
            function (err) {
                if (err) return reject(err);
                resolve(starter);
            });
    });
}

module.exports = {
    initDB,
    createUser,
    loginUser,
    getUser,
    updateInventory,
    refillPogs,
    recordResult,
    rollStarterPogs
};
