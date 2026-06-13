# Installation

## Prerequisites

- Node.js (v16 or higher recommended)
- npm

## Steps

1. Clone the repository:
```bash
git clone https://github.com/nurdthug/CryptoPogs.git
cd CryptoPogs
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node server.js
```

4. Open browser to `http://localhost:3000`

## Database

SQLite database (`pogs_db.sqlite`) is created automatically on first run.

## Static Hosting (Frontend Only)

The `index.html` landing page can be hosted on GitHub Pages for the collection view. However, the multiplayer game requires the Node.js backend.

## Solana Scripts (Optional)

For blockchain functionality:
1. Install Solana CLI
2. Install Rust and Anchor
3. Navigate to `SOLANA CODE/`
4. Run scripts with bash

## Related Articles

- [[environment]]
- [[dependencies]]
