const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./pogs_db.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

function initDB() {
    db.serialize(() => {
        // Players table
        db.run(`CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      pog_inventory TEXT DEFAULT '[]', -- JSON string of pog IDs
      refill_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    });
}

function createUser(username, password) {
    return new Promise(async (resolve, reject) => {
        try {
            const hash = await bcrypt.hash(password, 10);
            // Give new users starter pack of 12 random pogs (simulated by just IDs for now)
            // For simplicity, let's just use the fallback IDs
            const starterPogs = [
                "bitcoin", "ethereum", "dogecoin", "cardano", "solana", "polkadot",
                "uniswap", "chainlink", "litecoin", "ripple", "binancecoin", "tether"
            ];

            const stmt = db.prepare("INSERT INTO players (username, password_hash, pog_inventory) VALUES (?, ?, ?)");
            stmt.run(username, hash, JSON.stringify(starterPogs), function (err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, username, pogs: starterPogs, refillCount: 0 });
            });
            stmt.finalize();
        } catch (err) {
            reject(err);
        }
    });
}

function loginUser(username, password) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM players WHERE username = ?", [username], async (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error("User not found"));

            const match = await bcrypt.compare(password, row.password_hash);
            if (match) {
                resolve({
                    id: row.id,
                    username: row.username,
                    pogs: JSON.parse(row.pog_inventory),
                    refillCount: row.refill_count
                });
            } else {
                reject(new Error("Invalid password"));
            }
        });
    });
}

function getUser(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT id, username, pog_inventory, refill_count FROM players WHERE id=?", [id], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            resolve({
                id: row.id,
                username: row.username,
                pogs: JSON.parse(row.pog_inventory),
                refillCount: row.refill_count
            });
        });
    });
}

function updateInventory(userId, newInventory) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE players SET pog_inventory = ? WHERE id = ?", [JSON.stringify(newInventory), userId], function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

function refillPogs(userId) {
    return new Promise((resolve, reject) => {
        const starterPogs = [
            "bitcoin", "ethereum", "dogecoin", "cardano", "solana", "polkadot",
            "uniswap", "chainlink", "litecoin", "ripple", "binancecoin", "tether"
        ];
        db.run("UPDATE players SET pog_inventory = ?, refill_count = refill_count + 1 WHERE id = ?",
            [JSON.stringify(starterPogs), userId],
            function (err) {
                if (err) return reject(err);
                resolve(starterPogs);
            });
    });
}

module.exports = {
    initDB,
    createUser,
    loginUser,
    getUser,
    updateInventory,
    refillPogs
};
