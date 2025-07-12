# Chess App Deployment Guide

## Backend Payout Service Setup

### 1. Environment Variables Required

Add these environment variables to your Netlify deployment:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# House Wallet Configuration  
HOUSE_WALLET_PRIVATE_KEY=your_house_wallet_private_key
SANKO_RPC_URL=https://sanko-rpc.example.com

# Optional: Custom RPC URL for Sanko network
SANKO_RPC_URL=https://your-sanko-rpc-endpoint
```

### 2. Database Schema Updates

Run this SQL in your Supabase SQL editor:

```sql
-- Add payout tracking columns to chess_games table
ALTER TABLE chess_games 
ADD COLUMN IF NOT EXISTS payout_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payout_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS payout_processed_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient payout processing queries
CREATE INDEX IF NOT EXISTS idx_chess_games_payout_status 
ON chess_games(game_state, payout_processed) 
WHERE game_state = 'finished' AND payout_processed = FALSE;
```

### 3. House Wallet Setup

1. Create a dedicated house wallet for payouts
2. Fund it with enough SANKO tokens for gas fees and payouts
3. Store the private key securely in Netlify environment variables
4. Ensure the wallet has permission to call the chess contract

### 4. How It Works

- The `game-monitor` function runs every 5 minutes
- It checks for finished games that haven't been paid out
- Automatically calls the smart contract using the house wallet
- Updates the database to mark payouts as processed
- Players no longer need to confirm transactions

### 5. Manual Override (House Admin)

House wallet can still manually resolve games using the admin interface in the multiplayer component.

## Benefits of This Approach

✅ **Immediate relief** - No more player transaction prompts  
✅ **Automatic payouts** - Games resolve automatically  
✅ **No contract changes** - Uses existing smart contract  
✅ **Audit trail** - All payouts tracked in database  
✅ **Fallback options** - Manual resolution still available  

## Future Migration to Modified Contract

For long-term decentralization, consider modifying the smart contract to:
- Allow house wallet to trigger payouts without player confirmation
- Implement automatic payout logic directly in the contract
- Remove dependency on backend service

This would provide true decentralization but requires contract redeployment. 