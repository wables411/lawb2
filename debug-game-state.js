#!/usr/bin/env node

// Debug script to check game state in Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Firebase configuration (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkGameState(inviteCode) {
  try {
    console.log(`Checking game state for invite code: ${inviteCode}`);
    
    const gameRef = ref(db, `chess_games/${inviteCode}`);
    const snapshot = await get(gameRef);
    
    if (snapshot.exists()) {
      const gameData = snapshot.val();
      console.log('Game data:', JSON.stringify(gameData, null, 2));
      
      console.log(`Game state: ${gameData.game_state}`);
      console.log(`Blue player: ${gameData.blue_player}`);
      console.log(`Red player: ${gameData.red_player}`);
      console.log(`Created at: ${gameData.created_at}`);
      
      if (gameData.game_state === 'waiting_for_join') {
        console.log('❌ Game is still waiting for join');
      } else if (gameData.game_state === 'active') {
        console.log('✅ Game is active');
      } else {
        console.log(`⚠️ Unknown game state: ${gameData.game_state}`);
      }
    } else {
      console.log('❌ Game not found');
    }
  } catch (error) {
    console.error('Error checking game state:', error);
  }
}

// Usage: node debug-game-state.js <inviteCode>
const inviteCode = process.argv[2];
if (!inviteCode) {
  console.log('Usage: node debug-game-state.js <inviteCode>');
  process.exit(1);
}

checkGameState(inviteCode);
