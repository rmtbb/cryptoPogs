// Distribution Script for $POG Tokens Based on CoinGecko Rankings
const fetch = require('node-fetch');
const { exec } = require('child_process');

// Fetch Cryptocurrency Market Data from CoinGecko
// This function fetches the top 250 cryptocurrencies ranked by market cap.
async function fetchCryptoData() {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
  );
  return await response.json();
}

// Calculate $POG Token Amount Based on Market Cap Rank
// If the rank is between 1 and 200, return the rank as the token amount.
// Otherwise, return 0 (invalid or out-of-range rank).
function calculatePogAmount(rank) {
  return rank > 0 && rank <= 200 ? rank : 0;
}

// Distribute $POG Tokens
// This function iterates through all cryptocurrencies fetched from CoinGecko
// and mints $POG tokens based on their market cap rank.
(async () => {
  try {
    // Fetch the latest crypto market data
    const cryptoData = await fetchCryptoData();

    // Loop through each cryptocurrency and distribute tokens
    for (const crypto of cryptoData) {
      const pogAmount = calculatePogAmount(crypto.market_cap_rank);

      // Only proceed if the calculated amount is greater than 0
      if (pogAmount > 0) {
        console.log(`Distributing ${pogAmount} $POG for ${crypto.name}`);

        // Execute the Solana CLI command to mint tokens
        exec(
          `solana-token mint $MILKCAP_MINT_ADDRESS $RECIPIENT_ADDRESS ${pogAmount}`,
          (error, stdout, stderr) => {
            if (error) {
              // Log an error if token minting fails
              console.error(`Error minting tokens: ${stderr}`);
            } else {
              // Log success if tokens were minted successfully
              console.log(`Successfully minted ${pogAmount} $POG for ${crypto.name}`);
            }
          }
        );
      }
    }
  } catch (error) {
    // Catch and log any errors during the API request or minting process
    console.error('Error fetching crypto data:', error);
  }
})();

