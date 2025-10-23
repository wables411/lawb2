#!/usr/bin/env node

// Script to fix stuck games by updating their state
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

// Firebase configuration (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function fixStuckGame(inviteCode) {
  try {
    console.log(`Fixing stuck game for invite code: ${inviteCode}`);
    
    const gameRef = ref(db, `chess_games/${inviteCode}`);
    const snapshot = await get(gameRef);
    
    if (snapshot.exists()) {
      const gameData = snapshot.val();
      console.log('Current game data:', JSON.stringify(gameData, null, 2));
      
      if (gameData.game_state === 'waiting_for_join' && gameData.blue_player && gameData.red_player && gameData.red_player !== '0x0000000000000000000000000000000000000000') {
        console.log('🔧 Game has both players but is stuck in waiting_for_join state. Fixing...');
        
        await update(gameRef, {
          game_state: 'active',
          current_player: 'blue'
        });
        
        console.log('✅ Game state updated to active');
      } else if (gameData.game_state === 'waiting_for_join') {
        console.log('⚠️ Game is still waiting for a second player to join');
      } else {
        console.log(`ℹ️ Game state is already: ${gameData.game_state}`);
      }
    } else {
      console.log('❌ Game not found');
    }
  } catch (error) {
    console.error('Error fixing game state:', error);
  }
}

// Usage: node fix-stuck-game.js <inviteCode>
const inviteCode = process.argv[2];
if (!inviteCode) {
  console.log('Usage: node fix-stuck-game.js <inviteCode>');
  process.exit(1);
}

fixStuckGame(inviteCode);
