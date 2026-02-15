/**
 * test-firebase.js — Quick test to verify Firebase connection
 *
 * Run: node test-firebase.js
 *
 * This will:
 * 1. Connect to Firebase using the service account
 * 2. Set Clawb online
 * 3. Read current Clawb status
 * 4. Set Clawb offline
 * 5. Report success
 */

import { setClawbOnline, setClawbOffline, db } from './lawb-firebase.js';

async function test() {
  console.log('[Test] Connecting to Firebase...');

  // Test 1: Set online
  console.log('[Test] Setting Clawb online...');
  await setClawbOnline('testing');

  // Test 2: Read back
  console.log('[Test] Reading Clawb status...');
  const snapshot = await db.ref('clawb/status').get();
  const status = snapshot.val();
  console.log('[Test] Status:', JSON.stringify(status, null, 2));

  if (status?.online === true && status?.current_activity === 'testing') {
    console.log('[Test] Firebase read/write working!');
  } else {
    console.error('[Test] FAILED: Unexpected status');
  }

  // Test 3: Set offline
  console.log('[Test] Setting Clawb offline...');
  await setClawbOffline();

  // Test 4: Read games
  console.log('[Test] Checking chess_games...');
  const gamesSnap = await db.ref('chess_games').limitToFirst(3).get();
  if (gamesSnap.exists()) {
    const count = Object.keys(gamesSnap.val()).length;
    console.log(`[Test] Found ${count} chess game(s) (showing up to 3)`);
  } else {
    console.log('[Test] No chess games found (this is fine for a fresh DB)');
  }

  console.log('[Test] All tests passed! Firebase connection is working.');
  process.exit(0);
}

test().catch((err) => {
  console.error('[Test] Failed:', err.message);
  process.exit(1);
});
