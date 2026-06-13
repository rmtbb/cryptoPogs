const { Connection, clusterApiUrl, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Network configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(NETWORK);

// Create connection to Solana cluster
const connection = new Connection(RPC_URL, 'confirmed');

// Escrow keypair for betting (loaded from file or env)
let escrowKeypair = null;
const ESCROW_KEYPAIR_PATH = path.join(__dirname, '..', 'escrow-keypair.json');

function getEscrowKeypair() {
    if (escrowKeypair) return escrowKeypair;

    // Try to load from file
    if (fs.existsSync(ESCROW_KEYPAIR_PATH)) {
        const secretKey = JSON.parse(fs.readFileSync(ESCROW_KEYPAIR_PATH, 'utf8'));
        escrowKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    } else if (process.env.ESCROW_SECRET_KEY) {
        // Load from environment variable (base58 encoded)
        const bs58 = require('bs58');
        escrowKeypair = Keypair.fromSecretKey(bs58.decode(process.env.ESCROW_SECRET_KEY));
    } else {
        // Generate new keypair for development
        console.log('No escrow keypair found, generating new one...');
        escrowKeypair = Keypair.generate();
        // Save to file for persistence during development
        fs.writeFileSync(
            ESCROW_KEYPAIR_PATH,
            JSON.stringify(Array.from(escrowKeypair.secretKey))
        );
        console.log('Escrow address:', escrowKeypair.publicKey.toBase58());
        console.log('Fund this address with devnet SOL: solana airdrop 2 ' + escrowKeypair.publicKey.toBase58() + ' --url devnet');
    }

    return escrowKeypair;
}

// NFT Collection address (set after deployment)
const COLLECTION_ADDRESS = process.env.COLLECTION_ADDRESS || null;

// Pog types with metadata
const POG_TYPES = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-logo.png' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
    { id: 'tether', symbol: 'USDT', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' }
];

module.exports = {
    connection,
    NETWORK,
    RPC_URL,
    getEscrowKeypair,
    COLLECTION_ADDRESS,
    POG_TYPES
};
