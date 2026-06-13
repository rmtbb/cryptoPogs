const nacl = require('tweetnacl');
const bs58 = require('bs58');
const crypto = require('crypto');

// In-memory nonce storage (use Redis in production)
const nonceStore = new Map();

// Nonce expiry time (60 seconds)
const NONCE_EXPIRY_MS = 60000;

/**
 * Generate a unique nonce for wallet authentication
 * @param {string} walletAddress - The wallet's public key (base58)
 * @returns {string} The generated nonce message
 */
function generateNonce(walletAddress) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const nonce = `Sign this message to authenticate with CryptoPogs.\n\nNonce: ${randomBytes}\nTimestamp: ${timestamp}\nWallet: ${walletAddress}`;

    nonceStore.set(walletAddress, {
        nonce,
        timestamp,
        randomBytes
    });

    return nonce;
}

/**
 * Verify a signed message from a Solana wallet
 * @param {string} walletAddress - The wallet's public key (base58)
 * @param {string} signature - The signature (base58 encoded)
 * @param {string} message - The original message that was signed
 * @returns {boolean} True if signature is valid
 */
function verifySignature(walletAddress, signature, message) {
    try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(walletAddress);

        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Verify wallet authentication with nonce
 * @param {string} walletAddress - The wallet's public key (base58)
 * @param {string} signature - The signature (base58 encoded)
 * @returns {{ valid: boolean, error?: string }}
 */
function verifyWalletAuth(walletAddress, signature) {
    const stored = nonceStore.get(walletAddress);

    if (!stored) {
        return { valid: false, error: 'No pending authentication request' };
    }

    // Check nonce expiry
    if (Date.now() - stored.timestamp > NONCE_EXPIRY_MS) {
        nonceStore.delete(walletAddress);
        return { valid: false, error: 'Authentication request expired' };
    }

    // Verify signature
    const isValid = verifySignature(walletAddress, signature, stored.nonce);

    // Clear nonce after verification attempt (one-time use)
    nonceStore.delete(walletAddress);

    if (!isValid) {
        return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
}

/**
 * Check if a wallet address is valid base58
 * @param {string} address - The wallet address to validate
 * @returns {boolean}
 */
function isValidWalletAddress(address) {
    try {
        const decoded = bs58.decode(address);
        return decoded.length === 32; // Solana public keys are 32 bytes
    } catch {
        return false;
    }
}

/**
 * Clean up expired nonces (call periodically)
 */
function cleanupExpiredNonces() {
    const now = Date.now();
    for (const [address, data] of nonceStore.entries()) {
        if (now - data.timestamp > NONCE_EXPIRY_MS) {
            nonceStore.delete(address);
        }
    }
}

// Clean up expired nonces every 5 minutes
setInterval(cleanupExpiredNonces, 5 * 60 * 1000);

module.exports = {
    generateNonce,
    verifySignature,
    verifyWalletAuth,
    isValidWalletAddress
};
