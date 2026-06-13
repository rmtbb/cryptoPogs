# Environment

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server listening port |

## Configuration

Currently, most configuration is hardcoded:

- **Database path**: `./pogs_db.sqlite`
- **Starter pogs**: Defined in `database.js`
- **Fallback crypto data**: Defined in `server.js`

## External Services

### CoinGecko API
- No API key required for basic endpoints
- Rate limiting may apply
- Used for:
  - Cryptocurrency market data
  - Coin logos/images

### GitHub Raw URLs
- Used for favicon and app icons
- Format: `https://github.com/nurdthug/CryptoPogs/blob/main/FILE?raw=true`

## Solana Environment (for blockchain scripts)

```bash
export WALLET_PATH=~/my-wallet.json
export MILKCAP_MINT_ADDRESS=""
export RECIPIENT_ADDRESS=""
```

## Related Articles

- [[installation]]
- [[tech-stack]]
