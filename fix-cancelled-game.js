// Script to manually fix the cancelled game in Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update } from 'firebase/database';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAed5bn78c6Mb5Y3ezULH9CEg7IAKYFAps",
  authDomain: "chess-220ee.firebaseapp.com",
  databaseURL: "https://chess-220ee-default-rtdb.firebaseio.com",
  projectId: "chess-220ee",
  storageBucket: "chess-220ee.firebasestorage.app",
  messagingSenderId: "724477138097",
  appId: "1:724477138097:web:7dc15f79db3bda5c763e90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// The invite code of the cancelled game
const inviteCode = '0x4305e25a232b';

// Update the game to mark it as cancelled
const updateGame = async () => {
  try {
    const gameRef = ref(db, `chess_games/${inviteCode}`);
    
    await update(gameRef, {
      game_state: 'cancelled',
      red_player: '0x0000000000000000000000000000000000000000',
      updated_at: new Date().toISOString()
    });
    
    console.log(`✅ Successfully updated game ${inviteCode} to cancelled state`);
    console.log('The game should now disappear from the lobby');
  } catch (error) {
    console.error('❌ Error updating game:', error);
  }
};

// Run the update
updateGame(); 