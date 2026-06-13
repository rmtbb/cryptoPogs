# Landing Page

The landing page (`index.html`) serves as the project homepage and pog gallery.

## Features

### Hero Section
- Gradient title "Collect & Trade Crypto Pogs"
- Project description
- CTA button linking to marketplace/game
- Animated featured pogs floating on right side

### Pog Gallery
- Grid display of cryptocurrency pogs
- Search functionality by name/symbol
- Filter buttons: All, Top 100, New Arrivals, Trending

### Wallet Connect
- MetaMask integration button in header
- Displays shortened address when connected

## Data Source

Fetches live data from CoinGecko API:
```javascript
fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1')
```

## Pog Card Display

Each pog card shows:
- Coin logo (circular)
- Coin name
- Symbol (uppercase)
- Market cap rank
- Genesis date (launch date)

## Color Extraction

`getAverageColor()` attempts to extract background color from coin logos:
- Uses canvas to sample corner pixels
- Falls back to white if CORS blocks access

## Filter Logic

- **All**: Full dataset
- **Top 100**: First 100 by market cap
- **New Arrivals**: Coins launched within 30 days
- **Trending**: Top 20 by 24h price change

## Related Articles

- [[features]]
- [[tech-stack]]
