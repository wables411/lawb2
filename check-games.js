const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGames() {
  console.log('🔍 Checking existing games in Supabase...\n');

  try {
    // Check all games
    const { data: allGames, error: allError } = await supabase
      .from('chess_games')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all games:', allError);
      return;
    }

    console.log(`📊 Total games in database: ${allGames?.length || 0}\n`);

    if (allGames && allGames.length > 0) {
      console.log('📋 All games:');
      allGames.forEach((game, index) => {
        console.log(`\n${index + 1}. Game ID: ${game.game_id}`);
        console.log(`   Blue Player: ${game.blue_player}`);
        console.log(`   Red Player: ${game.red_player || 'None'}`);
        console.log(`   State: ${game.game_state}`);
        console.log(`   Chain: ${game.chain}`);
        console.log(`   Bet Amount: ${game.bet_amount}`);
        console.log(`   Created: ${game.created_at}`);
        console.log(`   Updated: ${game.updated_at}`);
        console.log(`   Public: ${game.is_public}`);
        if (game.game_title) {
          console.log(`   Title: ${game.game_title}`);
        }
      });
    }

    // Check active games
    const { data: activeGames, error: activeError } = await supabase
      .from('chess_games')
      .select('*')
      .eq('game_state', 'active')
      .order('created_at', { ascending: false });

    if (activeError) {
      console.error('❌ Error fetching active games:', activeError);
      return;
    }

    console.log(`\n🎮 Active games: ${activeGames?.length || 0}`);
    if (activeGames && activeGames.length > 0) {
      activeGames.forEach((game, index) => {
        console.log(`\n${index + 1}. Game ID: ${game.game_id}`);
        console.log(`   Blue: ${game.blue_player}`);
        console.log(`   Red: ${game.red_player}`);
        console.log(`   Current Player: ${game.current_player}`);
        console.log(`   Bet: ${game.bet_amount}`);
      });
    }

    // Check waiting games
    const { data: waitingGames, error: waitingError } = await supabase
      .from('chess_games')
      .select('*')
      .eq('game_state', 'waiting')
      .order('created_at', { ascending: false });

    if (waitingError) {
      console.error('❌ Error fetching waiting games:', waitingError);
      return;
    }

    console.log(`\n⏳ Waiting games: ${waitingGames?.length || 0}`);
    if (waitingGames && waitingGames.length > 0) {
      waitingGames.forEach((game, index) => {
        console.log(`\n${index + 1}. Game ID: ${game.game_id}`);
        console.log(`   Blue: ${game.blue_player}`);
        console.log(`   Bet: ${game.bet_amount}`);
        console.log(`   Public: ${game.is_public}`);
        console.log(`   Created: ${game.created_at}`);
      });
    }

    // Check Sanko chain games specifically
    const { data: sankoGames, error: sankoError } = await supabase
      .from('chess_games')
      .select('*')
      .eq('chain', 'sanko')
      .order('created_at', { ascending: false });

    if (sankoError) {
      console.error('❌ Error fetching Sanko games:', sankoError);
      return;
    }

    console.log(`\n🔗 Sanko chain games: ${sankoGames?.length || 0}`);
    if (sankoGames && sankoGames.length > 0) {
      sankoGames.forEach((game, index) => {
        console.log(`\n${index + 1}. Game ID: ${game.game_id}`);
        console.log(`   State: ${game.game_state}`);
        console.log(`   Blue: ${game.blue_player}`);
        console.log(`   Red: ${game.red_player || 'None'}`);
        console.log(`   Bet: ${game.bet_amount}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkGames(); 