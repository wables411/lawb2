# Farcaster Notifications Implementation Guide

## Overview
This guide explains how to implement notifications that alert users when new PVP matches are created and awaiting opponents.

## Prerequisites
- Backend server (Node.js/Express, Python/Flask, etc.)
- Database to store notification tokens
- Firebase access (you already have this)

## Step 1: Set Up Webhook Endpoint

Create a backend endpoint to receive webhook events from Farcaster clients.

### Example Node.js/Express Implementation

```javascript
// server.js or api/webhook.js
const express = require('express');
const app = express();
app.use(express.json());

// Store notification tokens (use a real database in production)
const notificationTokens = new Map(); // userId -> { token, url }

app.post('/api/farcaster-webhook', async (req, res) => {
  const { event, data } = req.body;
  
  console.log('[WEBHOOK] Received event:', event);
  
  if (event === 'notifications_enabled') {
    // User enabled notifications
    const { userId, token, url } = data;
    notificationTokens.set(userId, { token, url });
    console.log('[WEBHOOK] Notifications enabled for user:', userId);
    
    // Store in your database
    // await db.saveNotificationToken(userId, token, url);
    
  } else if (event === 'notifications_disabled') {
    // User disabled notifications
    const { userId } = data;
    notificationTokens.delete(userId);
    console.log('[WEBHOOK] Notifications disabled for user:', userId);
    
    // Remove from database
    // await db.removeNotificationToken(userId);
  }
  
  res.status(200).json({ success: true });
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

## Step 2: Update farcaster.json

Add the `webhookUrl` to your manifest:

```json
{
  "miniapp": {
    "webhookUrl": "https://lawb.xyz/api/farcaster-webhook",
    // ... rest of your config
  }
}
```

## Step 3: Listen for GameCreated Events on Contract

**Much better approach:** Listen directly to the blockchain contract events. This is the source of truth and works across all chains.

### Contract Event Details

The contract emits a `GameCreated` event with:
- `inviteCode` (bytes6)
- `player1` (address) 
- `wagerAmount` (uint256)
- `wagerToken` (address)

### Multi-Chain Contract Addresses

```javascript
const CONTRACT_ADDRESSES = {
  base: '0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11',
  sanko: '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56',
  arbitrum: '0x0000000000000000000000000000000000000000' // TODO: Update when deployed
};

const RPC_URLS = {
  base: 'https://mainnet.base.org',
  sanko: 'https://mainnet.sanko.xyz',
  arbitrum: 'https://arb1.arbitrum.io/rpc'
};
```

### Example Implementation with ethers.js

```javascript
// server.js - Listen to contract events
const { ethers } = require('ethers');
const CHESS_CONTRACT_ABI = require('./abis/chess.json'); // Your contract ABI

// Set up providers for each chain
const providers = {
  base: new ethers.JsonRpcProvider(RPC_URLS.base),
  sanko: new ethers.JsonRpcProvider(RPC_URLS.sanko),
  arbitrum: new ethers.JsonRpcProvider(RPC_URLS.arbitrum)
};

// Listen to GameCreated events on all chains
async function setupContractListeners() {
  for (const [chain, provider] of Object.entries(providers)) {
    const contractAddress = CONTRACT_ADDRESSES[chain];
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`[LISTENER] Skipping ${chain} - contract not deployed`);
      continue;
    }
    
    const contract = new ethers.Contract(contractAddress, CHESS_CONTRACT_ABI, provider);
    
    // Listen for GameCreated events
    contract.on('GameCreated', async (inviteCode, player1, wagerAmount, wagerToken, event) => {
      console.log(`[${chain.toUpperCase()}] GameCreated event:`, {
        inviteCode,
        player1,
        wagerAmount: wagerAmount.toString(),
        wagerToken,
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash
      });
      
      // Format invite code (bytes6 to hex string)
      const inviteCodeHex = '0x' + inviteCode.slice(2).padStart(12, '0');
      
      // Get token symbol from address (you'll need a mapping)
      const tokenSymbol = await getTokenSymbol(wagerToken, chain);
      
      // Format wager amount (you'll need token decimals)
      const tokenDecimals = await getTokenDecimals(wagerToken, chain);
      const formattedAmount = ethers.formatUnits(wagerAmount, tokenDecimals);
      
      // Send notification
      await sendNewGameNotification({
        inviteCode: inviteCodeHex,
        player1,
        wagerAmount: formattedAmount,
        wagerToken,
        tokenSymbol,
        chain,
        blockNumber: event.log.blockNumber
      });
    });
    
    console.log(`[LISTENER] ✅ Listening to ${chain} contract at ${contractAddress}`);
  }
}

// Helper to get token symbol (you'll need to implement this)
async function getTokenSymbol(tokenAddress, chain) {
  // Option 1: Use a mapping of known tokens
  const TOKEN_MAP = {
    '0x754cDAd6f5821077d6915004Be2cE05f93d176f8': 'DMT',
    '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F': 'LAWB',
    // ... add more
  };
  
  if (TOKEN_MAP[tokenAddress.toLowerCase()]) {
    return TOKEN_MAP[tokenAddress.toLowerCase()];
  }
  
  // Option 2: Call ERC20 symbol() if it's a standard token
  try {
    const erc20Abi = ['function symbol() view returns (string)'];
    const provider = providers[chain];
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    return await tokenContract.symbol();
  } catch (error) {
    console.warn(`[TOKEN] Could not get symbol for ${tokenAddress}:`, error);
    return tokenAddress.slice(0, 6) + '...'; // Fallback
  }
}

// Start listening
setupContractListeners().catch(console.error);
```

### Alternative: Use BaseScan/Block Explorer APIs

For a simpler approach without running a persistent listener, you can poll BaseScan API:

```javascript
// Poll BaseScan API for new GameCreated events
async function pollForNewGames(chain = 'base') {
  const contractAddress = CONTRACT_ADDRESSES[chain];
  const explorerApi = chain === 'base' 
    ? 'https://api.basescan.org/api'
    : 'https://api.etherscan.io/api'; // Adjust for other chains
  
  // Get latest block with events
  const response = await fetch(
    `${explorerApi}?module=logs&action=getLogs&address=${contractAddress}&topic0=0x...&apikey=YOUR_API_KEY`
  );
  
  const data = await response.json();
  // Process events...
}
```

### Why Contract Events Are Better

✅ **Source of truth** - Contract is the definitive record  
✅ **Multi-chain** - Works across Base, Sanko, Arbitrum  
✅ **Reliable** - Doesn't depend on Firebase sync  
✅ **Real-time** - Events fire immediately on-chain  
✅ **No missed games** - Catches all games, even if Firebase fails

## Step 4: Send Notifications

Create a function to send notifications to all subscribed users:

```javascript
async function sendNewGameNotification(gameData) {
  const { inviteCode, wagerAmount, tokenSymbol, chain, player1 } = gameData;
  
  // Get all notification tokens from your database
  const tokens = await getAllNotificationTokens();
  
  if (tokens.length === 0) {
    console.log('[NOTIFICATION] No users with notifications enabled');
    return;
  }
  
  // Format the notification message
  const chainName = chain.charAt(0).toUpperCase() + chain.slice(1);
  const notificationData = {
    notificationId: `new-game-${inviteCode}-${Date.now()}`,
    title: "🎮 New Chess Match Available!",
    body: `A new ${tokenSymbol} match (${wagerAmount}) is waiting for an opponent on ${chainName}`,
    targetUrl: `https://lawb.xyz?join=${inviteCode}`,
    tokens: tokens.map(t => t.token) // Array of all user tokens
  };
  
  // Send to each user's notification URL
  for (const userToken of tokens) {
    try {
      const response = await fetch(userToken.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notificationData,
          tokens: [userToken.token] // Send to individual user
        })
      });
      
      if (response.ok) {
        console.log('[NOTIFICATION] ✅ Sent to user:', userToken.userId);
      } else {
        console.error('[NOTIFICATION] ❌ Failed to send:', response.statusText);
      }
    } catch (error) {
      console.error('[NOTIFICATION] ❌ Error sending notification:', error);
    }
  }
}
```

## Step 5: Database Schema

Store notification tokens in your database:

```sql
-- Example SQL schema
CREATE TABLE notification_tokens (
  user_id VARCHAR(255) PRIMARY KEY,
  token TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Or for Firebase:

```javascript
// Store in Firebase Realtime Database
const notificationRef = ref(database, `notifications/${userId}`);
await set(notificationRef, {
  token: token,
  url: url,
  created_at: new Date().toISOString()
});
```

## Step 6: Deploy Webhook Endpoint

Deploy your webhook endpoint to a server that:
- Is publicly accessible (HTTPS required)
- Can handle POST requests
- Has access to your Firebase database
- Can store notification tokens

Options:
- **Vercel/Netlify Functions** (serverless)
- **Railway/Render** (simple Node.js hosting)
- **Your existing server** (if you have one)

## Implementation Difficulty: Medium

**Time Estimate:** 4-8 hours

**Complexity Breakdown:**
- Webhook endpoint: Easy (1-2 hours)
- Contract event listener: Medium (2-3 hours) - Multi-chain setup adds complexity
- Token symbol/decimals lookup: Easy (1 hour)
- Notification sending: Medium (2-3 hours)
- Testing & debugging: Medium (2-3 hours)

**Note:** Contract event listening is more reliable than Firebase but requires:
- Persistent connection to RPC nodes (or use event indexing service)
- Handling reconnections if connection drops
- Processing historical events on startup (optional)

## Alternative: Use Neynar's Managed Service

For a simpler solution, consider using Neynar's notification service which handles token management:

```javascript
// Using Neynar SDK
const { NeynarAPIClient } = require('@neynar/nodejs-sdk');
const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

// Send notification
await neynarClient.publishCast({
  signerUuid: process.env.SIGNER_UUID,
  text: `New chess match available! Join: https://lawb.xyz?join=${inviteCode}`
});
```

## Testing

1. Enable notifications in your app
2. Verify webhook receives `notifications_enabled` event
3. Create a test game on-chain (Base or Sanko)
4. Verify contract event listener catches `GameCreated` event
5. Verify notification is sent to subscribed users
6. Test with multiple users and multiple chains
7. Test reconnection handling (restart server, verify it catches up)

## Production Considerations

### Event Listener Reliability

For production, consider:
- **Event indexing service** (Alchemy, Infura, The Graph) instead of direct RPC
- **Process historical events** on startup to catch missed games
- **Persistent storage** of last processed block number
- **Retry logic** for failed notifications
- **Rate limiting** to avoid spamming users

### Example: Store Last Processed Block

```javascript
let lastProcessedBlock = {
  base: 0,
  sanko: 0,
  arbitrum: 0
};

// On startup, load from database
async function initializeListeners() {
  // Load last processed blocks from database
  lastProcessedBlock = await db.getLastProcessedBlocks();
  
  // Process any missed events since last run
  await processMissedEvents();
  
  // Start listening for new events
  await setupContractListeners();
}

async function processMissedEvents() {
  for (const [chain, provider] of Object.entries(providers)) {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = lastProcessedBlock[chain] || currentBlock - 1000; // Look back 1000 blocks
    
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES[chain], 
      CHESS_CONTRACT_ABI, 
      provider
    );
    
    const events = await contract.queryFilter('GameCreated', fromBlock, currentBlock);
    
    for (const event of events) {
      // Process each event
      await handleGameCreatedEvent(event, chain);
    }
    
    // Update last processed block
    lastProcessedBlock[chain] = currentBlock;
    await db.saveLastProcessedBlock(chain, currentBlock);
  }
}
```

## Security Considerations

- Validate webhook requests (verify signatures if Farcaster provides them)
- Store tokens securely (encrypted)
- Rate limit notification sending
- Handle errors gracefully (don't spam users)






