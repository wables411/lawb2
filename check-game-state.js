// Quick script to check game state
// Run with: node check-game-state.js

const inviteCode = '0xc3914d386391';

console.log('Checking game state for:', inviteCode);
console.log('\nFirebase URL:');
console.log(`https://chess-220ee-default-rtdb.firebaseio.com/chess_games/${inviteCode}.json`);
console.log('\nContract check:');
console.log('Check on explorer.sanko.xyz if isActive = false');
console.log('\nExpected behavior:');
console.log('- Contract should show isActive = false (game ended)');
console.log('- Firebase should show game_state: "finished"');
console.log('- When clicking PvP, should NOT reload this game');

