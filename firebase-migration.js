// Migration script: Supabase to Firebase
// Run this to migrate your chess games data

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import { createClient } from '@supabase/supabase-js';

// Firebase config (you'll get this from Firebase console)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Supabase config (your existing config)
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-anon-key';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateChessGames() {
  console.log('Starting migration...');
  
  try {
    // Get all chess games from Supabase
    const { data: games, error } = await supabase
      .from('chess_games')
      .select('*');
    
    if (error) {
      console.error('Error fetching from Supabase:', error);
      return;
    }
    
    console.log(`Found ${games.length} games to migrate`);
    
    // Migrate each game to Firebase
    for (const game of games) {
      const gameRef = ref(db, `chess_games/${game.game_id}`);
      await set(gameRef, {
        ...game,
        migrated_at: new Date().toISOString()
      });
      console.log(`Migrated game: ${game.game_id}`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
migrateChessGames(); 