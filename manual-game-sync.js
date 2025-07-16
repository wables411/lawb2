// Manual game sync script for the missing game
// This script will add the game that was created in the contract but not in Firebase

const gameData = {
  invite_code: "0x2bde8072dc6a",
  game_title: "Game 2dc6a",
  bet_amount: "500000000000000000", // 0.5 tDMT in wei
  blue_player: "0x9CCa475416BC3448A539E30369792A090859De9d",
  red_player: "0x0000000000000000000000000000000000000000", // Zero address for waiting game
  game_state: "waiting",
  board: {
    positions: {
      "0_0": "R", "0_1": "N", "0_2": "B", "0_3": "Q", "0_4": "K", "0_5": "B", "0_6": "N", "0_7": "R",
      "1_0": "P", "1_1": "P", "1_2": "P", "1_3": "P", "1_4": "P", "1_5": "P", "1_6": "P", "1_7": "P",
      "6_0": "p", "6_1": "p", "6_2": "p", "6_3": "p", "6_4": "p", "6_5": "p", "6_6": "p", "6_7": "p",
      "7_0": "r", "7_1": "n", "7_2": "b", "7_3": "q", "7_4": "k", "7_5": "b", "7_6": "n", "7_7": "r"
    },
    rows: 8,
    cols: 8
  },
  current_player: "blue",
  chain: "sanko",
  contract_address: "0x3112AF5728520F52FD1C6710dD7bD52285a68e47",
  is_public: true,
  created_at: new Date().toISOString()
};

console.log('Game data to add to Firebase:');
console.log(JSON.stringify(gameData, null, 2));

// Instructions:
// 1. Go to Firebase console
// 2. Navigate to the chess_games collection
// 3. Add a new document with ID: 0x2bde8072dc6a
// 4. Copy the above gameData object as the document data
// 5. Save the document

console.log('\nSteps to manually add this game:');
console.log('1. Go to Firebase console');
console.log('2. Navigate to chess_games collection');
console.log('3. Add new document with ID: 0x2bde8072dc6a');
console.log('4. Copy the gameData object above as document data');
console.log('5. Save the document'); 