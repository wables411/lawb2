const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Smart contract ABI for the endGame function
const CHESS_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes6",
        "name": "inviteCode",
        "type": "bytes6"
      },
      {
        "internalType": "address",
        "name": "winner",
        "type": "address"
      }
    ],
    "name": "endGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CHESS_CONTRACT_ADDRESS = '0x3112AF5728520F52FD1C6710dD7bD52285a68e47';

// House wallet private key (should be stored securely)
const HOUSE_WALLET_PRIVATE_KEY = process.env.HOUSE_WALLET_PRIVATE_KEY;

// Provider for Sanko network
const provider = new ethers.JsonRpcProvider(process.env.SANKO_RPC_URL || 'https://sanko-rpc.example.com');

// House wallet instance
const houseWallet = new ethers.Wallet(HOUSE_WALLET_PRIVATE_KEY, provider);

// Contract instance
const chessContract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, CHESS_CONTRACT_ABI, houseWallet);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Check for finished games that haven't been paid out
    const { data: finishedGames, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('game_state', 'finished')
      .is('payout_processed', null)
      .not('winner', 'is', null);

    if (error) {
      console.error('Error fetching finished games:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database error' })
      };
    }

    if (!finishedGames || finishedGames.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'No pending payouts found' })
      };
    }

    const results = [];

    for (const game of finishedGames) {
      try {
        console.log(`Processing payout for game ${game.game_id}, winner: ${game.winner}`);

        // Convert gameId to bytes6 format for contract
        const bytes6InviteCode = game.game_id.padEnd(6, '0').slice(0, 6);
        
        // Determine winner address
        const winnerAddress = game.winner === 'blue' ? game.blue_player : game.red_player;
        
        if (!winnerAddress) {
          console.error(`No winner address found for game ${game.game_id}`);
          continue;
        }

        // Call the smart contract
        const tx = await chessContract.endGame(
          bytes6InviteCode,
          winnerAddress,
          { gasLimit: 200000 } // Adjust gas limit as needed
        );

        console.log(`Transaction sent: ${tx.hash}`);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log(`Transaction confirmed: ${receipt.transactionHash}`);

        // Mark payout as processed in database
        const { error: updateError } = await supabase
          .from('chess_games')
          .update({
            payout_processed: true,
            payout_tx_hash: receipt.transactionHash,
            payout_processed_at: new Date().toISOString()
          })
          .eq('game_id', game.game_id);

        if (updateError) {
          console.error(`Error updating payout status for game ${game.game_id}:`, updateError);
        }

        results.push({
          game_id: game.game_id,
          status: 'success',
          tx_hash: receipt.transactionHash
        });

      } catch (gameError) {
        console.error(`Error processing game ${game.game_id}:`, gameError);
        results.push({
          game_id: game.game_id,
          status: 'error',
          error: gameError.message
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Processed ${results.length} games`,
        results
      })
    };

  } catch (error) {
    console.error('Error in game monitor:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 