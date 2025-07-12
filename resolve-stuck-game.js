const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://lahldngklxwirmtbnjyk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resolveStuckGame() {
  const gameId = '39308204b531';
  
  try {
    console.log('Resolving stuck game:', gameId);
    
    // Update the game to finished state with red as winner (since blue is in checkmate)
    const { data, error } = await supabase
      .from('chess_games')
      .update({
        game_state: 'finished',
        winner: 'red',
        updated_at: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .select();
    
    if (error) {
      console.error('Error resolving game:', error);
      return;
    }
    
    console.log('Game resolved successfully:', data);
    console.log('Red player wins! Payout will be processed by the backend service.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the resolution
resolveStuckGame(); 