#!/bin/bash
# Deployment Script for $MILKCAP Token Creation
# This script automates creating a Solana wallet, deploying the $MILKCAP token mint, 
# and minting an initial supply of tokens. Ensure that Solana CLI, Rust, and Anchor are installed.

# Step 1: Set Up Environment Variables
# Define the file path for the wallet keypair and initialize the token mint address variable.
export WALLET_PATH=~/my-wallet.json
export MILKCAP_MINT_ADDRESS=""

# Step 2: Create a New Wallet
# This command generates a new Solana wallet keypair and saves it to the specified file.
solana-keygen new --outfile $WALLET_PATH

# Step 3: Fund Wallet (Manual Step)
# Notify the user to fund the new wallet using a Solana faucet or an exchange.
echo "Please fund your wallet using a Solana faucet or exchange."
# Display the wallet's public key so the user knows where to send the funds.
echo "Wallet address: $(solana-keygen pubkey $WALLET_PATH)"
# Wait for the user to confirm the wallet has been funded.
read -p "Press ENTER after funding the wallet..."

# Step 4: Create $MILKCAP Token Mint
# Create a new SPL token using the Solana CLI and extract the token mint address from the output.
MILKCAP_MINT_ADDRESS=$(solana-token create-token | grep 'Creating token' | awk '{print $3}')
# Display the newly created token mint address.
echo "Token Mint Created! Mint Address: $MILKCAP_MINT_ADDRESS"

# Step 5: Create Token Account
# Create a token account associated with the $MILKCAP mint to hold minted tokens.
solana-token create-account $MILKCAP_MINT_ADDRESS

# Step 6: Mint Initial Supply
# Prompt the user for the recipient wallet address where the initial token supply will be sent.
read -p "Enter recipient wallet address for initial $MILKCAP supply: " RECIPIENT_ADDRESS
# Prompt the user for the amount of tokens to mint.
read -p "Enter amount of $MILKCAP to mint: " MINT_AMOUNT

# Use the Solana CLI to mint the specified amount of tokens to the recipient's wallet.
solana-token mint $MILKCAP_MINT_ADDRESS $RECIPIENT_ADDRESS $MINT_AMOUNT

# Notify the user that the token creation process is complete.
echo "Token Creation Complete! $MILKCAP is ready."

