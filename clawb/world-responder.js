/**
 * world-responder.js — Clawb's world presence
 * 
 * Listens to world actions (dance, swim, etc.) and can respond
 * Could also post to world chat when actions happen
 */

import { db } from './lawb-firebase.js';

const ACTIONS_TO_ACKNOWLEDGE = ['dance', 'wave', 'spin'];

async function handleWorldAction(action) {
  const { id, action: actionType, by, source, timestamp } = action;
  
  // Only acknowledge certain actions
  if (!ACTIONS_TO_ACKNOWLEDGE.includes(actionType)) return;
  
  // Don't respond to old actions (>1 min ago)
  if (Date.now() - timestamp > 60000) return;
  
  console.log(`[World] ${by} performed ${actionType} from ${source}`);
  
  // Could post a chat message or perform a counter-action
  // For now just log it
}

export async function startWorldResponder() {
  console.log('[World] Starting world responder...');
  
  // Listen for world actions
  db.ref('clawb/world/actions')
    .orderByChild('timestamp')
    .startAt(Date.now())
    .on('child_added', (snapshot) => {
      const action = { id: snapshot.key, ...snapshot.val() };
      handleWorldAction(action);
    });
  
  console.log('[World] Listening for world actions.');
}
