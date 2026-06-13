# External APIs

## CoinGecko API

### Purpose
Provides cryptocurrency market data and coin logos.

### Endpoint Used
```
GET https://api.coingecko.com/api/v3/coins/markets
```

### Parameters
- `vs_currency=usd` - Price in USD
- `order=market_cap_desc` - Sort by market cap
- `per_page=250` - Number of results
- `page=1` - Page number
- `sparkline=false` - Exclude sparkline data

### Response Fields Used
- `id` - Coin identifier (e.g., "bitcoin")
- `symbol` - Ticker symbol (e.g., "btc")
- `name` - Full name (e.g., "Bitcoin")
- `image` - Logo URL
- `market_cap_rank` - Ranking position
- `genesis_date` - Coin launch date
- `current_price` - Current USD price
- `price_change_percentage_24h` - 24h change

### Rate Limiting
Free tier has rate limits. Fallback data in `server.js` handles API failures.

## GitHub Raw Content

### Purpose
Serves project assets (favicon, icons) via GitHub.

### Format
```
https://github.com/nurdthug/CryptoPogs/blob/main/FILE?raw=true
```

### Assets Served
- favicon.png
- home_screen_icon_*.png (various sizes)
- regpreview.png (OG preview image)

## Related Articles

- [[landing-page]]
- [[tech-stack]]
