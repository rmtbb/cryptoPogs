# Solana Scripts

The `SOLANA CODE/` directory contains shell scripts for blockchain token operations.

## mintMILKCAP.sh

Creates a new $MILKCAP SPL token on Solana.

### Steps
1. Generate new wallet keypair
2. Manual step: Fund wallet via faucet/exchange
3. Create SPL token mint
4. Create associated token account
5. Mint initial supply to recipient

### Commands Used
```bash
solana-keygen new --outfile ~/my-wallet.json
solana-token create-token
solana-token create-account $MINT_ADDRESS
solana-token mint $MINT_ADDRESS $RECIPIENT $AMOUNT
```

## distributePOG.sh

Distributes $POG tokens based on CoinGecko market cap rankings.

### Logic
- Fetches top 250 cryptos from CoinGecko
- For each crypto ranked 1-200:
  - Mints tokens equal to rank number
  - E.g., Bitcoin (#1) gets 1 token, Ethereum (#2) gets 2

### Implementation
```javascript
function calculatePogAmount(rank) {
  return rank > 0 && rank <= 200 ? rank : 0;
}
```

## distributePOG-withmoredetails.sh

Enhanced version with metadata per token:
- Batch ID (timestamp)
- Crypto symbol
- Current price
- Token ID (e.g., "3/5")
- Mint date

## Prerequisites

- Solana CLI installed
- Rust/Anchor toolchain
- Funded wallet for transaction fees

## Related Articles

- [[tech-stack]]
- [[dependencies]]
