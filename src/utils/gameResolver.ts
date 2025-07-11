import { supabase } from '../supabaseClient';

// Utility to resolve the specific stuck game
export const resolveStuckGame = async (
  gameId: string = '39308204b531',
  resolution: 'blue_win' | 'red_win' | 'draw' | 'refund' = 'refund'
) => {
  try {
    let gameState = 'finished';
    let winner = null;
    let gameStatus = '';

    switch (resolution) {
      case 'blue_win':
        winner = 'blue';
        gameStatus = 'Blue wins (forced resolution)';
        break;
      case 'red_win':
        winner = 'red';
        gameStatus = 'Red wins (forced resolution)';
        break;
      case 'draw':
        gameStatus = 'Game ended in draw (forced resolution)';
        break;
      case 'refund':
        gameState = 'refunded';
        gameStatus = 'Game refunded (forced resolution)';
        break;
    }

    const { error } = await supabase
      .from('chess_games')
      .update({
        game_state: gameState,
        winner: winner,
        updated_at: new Date().toISOString()
      })
      .eq('game_id', gameId);

    if (error) {
      console.error('Error forcing game resolution:', error);
      return { success: false, error };
    }

    console.log(`Game ${gameId} resolved: ${gameStatus}`);
    return { success: true, gameStatus };
  } catch (error) {
    console.error('Error resolving stuck game:', error);
    return { success: false, error };
  }
};

// Check current game state
export const checkGameState = async (gameId: string = '39308204b531') => {
  try {
    const { data, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error) {
      console.error('Error checking game state:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error checking game state:', error);
    return null;
  }
};

// Resume the specific game
export const resumeSpecificGame = async (gameId: string = '39308204b531') => {
  try {
    const gameData = await checkGameState(gameId);
    
    if (!gameData) {
      console.error('Game not found');
      return null;
    }

    console.log('Game data:', gameData);
    return gameData;
  } catch (error) {
    console.error('Error resuming game:', error);
    return null;
  }
}; 