#!/usr/bin/env node

// Fix script for the specific stuck game with invite code 0x23179db6d7cb
console.log('🔧 Fixing specific stuck game: 0x23179db6d7cb');
console.log('');
console.log('The game has both players but is stuck in "waiting" state.');
console.log('To fix this, run the following in the browser console:');
console.log('');
console.log('1. window.fixStuckGame()');
console.log('2. If that doesn\'t work, try: window.forceGameActive()');
console.log('');
console.log('The debug output shows:');
console.log('- Game state: waiting (should be active)');
console.log('- Blue player: 0x9387B5a08d050427F74CC9949D811EB6eaEe1090');
console.log('- Red player: 0x6D0987c57608Cc174d6F6BadA70f8D0a25026113');
console.log('- Both players are present, so game should be active');
console.log('');
console.log('This is a classic case where the transaction was confirmed on-chain');
console.log('but the Firebase state wasn\'t updated properly.');
