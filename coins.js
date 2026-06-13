// Shared crypto-pog roster. Each pog has a rarity tier that drives its visual
// flair (ring colour / glow) and is purely cosmetic for gameplay.
//
// rarity: common | rare | epic | legendary
const COIN_POOL = [
    { id: "bitcoin",     symbol: "btc",   name: "Bitcoin",   rarity: "legendary", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
    { id: "ethereum",    symbol: "eth",   name: "Ethereum",  rarity: "legendary", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
    { id: "solana",      symbol: "sol",   name: "Solana",    rarity: "epic",      image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
    { id: "binancecoin", symbol: "bnb",   name: "BNB",       rarity: "epic",      image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" },
    { id: "ripple",      symbol: "xrp",   name: "XRP",       rarity: "epic",      image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png" },
    { id: "cardano",     symbol: "ada",   name: "Cardano",   rarity: "rare",      image: "https://assets.coingecko.com/coins/images/975/large/cardano.png" },
    { id: "dogecoin",    symbol: "doge",  name: "Dogecoin",  rarity: "rare",      image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png" },
    { id: "polkadot",    symbol: "dot",   name: "Polkadot",  rarity: "rare",      image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png" },
    { id: "chainlink",   symbol: "link",  name: "Chainlink", rarity: "rare",      image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png" },
    { id: "avalanche-2", symbol: "avax",  name: "Avalanche", rarity: "rare",      image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png" },
    { id: "polygon",     symbol: "matic", name: "Polygon",   rarity: "rare",      image: "https://assets.coingecko.com/coins/images/4713/large/polygon.png" },
    { id: "uniswap",     symbol: "uni",   name: "Uniswap",   rarity: "rare",      image: "https://assets.coingecko.com/coins/images/12504/large/uniswap.png" },
    { id: "litecoin",    symbol: "ltc",   name: "Litecoin",  rarity: "common",    image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png" },
    { id: "tron",        symbol: "trx",   name: "Tron",      rarity: "common",    image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png" },
    { id: "stellar",     symbol: "xlm",   name: "Stellar",   rarity: "common",    image: "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png" },
    { id: "cosmos",      symbol: "atom",  name: "Cosmos",    rarity: "common",    image: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png" },
    { id: "monero",      symbol: "xmr",   name: "Monero",    rarity: "common",    image: "https://assets.coingecko.com/coins/images/69/large/monero_logo.png" },
    { id: "tether",      symbol: "usdt",  name: "Tether",    rarity: "common",    image: "https://assets.coingecko.com/coins/images/325/large/Tether.png" },
    { id: "shiba-inu",   symbol: "shib",  name: "Shiba Inu", rarity: "common",    image: "https://assets.coingecko.com/coins/images/11939/large/shiba.png" },
    { id: "pepe",        symbol: "pepe",  name: "Pepe",      rarity: "common",    image: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg" }
];

const COIN_MAP = {};
COIN_POOL.forEach(c => { COIN_MAP[c.id] = c; });

function getCoin(id) {
    return COIN_MAP[id] || COIN_POOL[0];
}

module.exports = { COIN_POOL, COIN_MAP, getCoin };
