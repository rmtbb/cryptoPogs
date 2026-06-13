# NPM Packages

Dependencies defined in `package.json`:

## Runtime Dependencies

### Web Server
- **express** (^5.2.1) - Web framework for serving static files and API routes

### Real-time Communication
- **socket.io** (^4.8.1) - WebSocket library for multiplayer game sync

### Database
- **sqlite3** (^5.1.7) - SQLite bindings for Node.js

### Authentication
- **bcrypt** (^6.0.0) - Password hashing
- **jsonwebtoken** (^9.0.3) - JWT token generation (future use)

### Solana Blockchain
- **@solana/web3.js** (^1.98.4) - Solana JavaScript SDK
- **@solana/spl-token** (^0.4.14) - SPL token operations
- **@metaplex-foundation/js** (^0.20.1) - NFT/Metaplex integration
- **bs58** (^6.0.0) - Base58 encoding for Solana addresses
- **tweetnacl** (^1.0.3) - Cryptographic library for signatures

## Dev Dependencies

None currently defined.

## Package.json Scripts

```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

No custom scripts defined; server runs via `node server.js`.

## Related Articles

- [[installation]]
- [[tech-stack]]
