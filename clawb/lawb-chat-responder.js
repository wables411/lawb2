/**
 * lawb-chat-responder.js — Clawb's chat brain
 *
 * Listens for visitor messages on Firebase (clawb/chat/visitor_messages/),
 * generates responses via OpenRouter (Claude), and posts them back (clawb/chat/messages/).
 *
 * Run standalone: node lawb-chat-responder.js
 */

import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  onVisitorMessage,
  postClawbMessage,
  setClawbOnline,
  heartbeat,
  db,
} from './lawb-firebase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('[Chat] OPENROUTER_API_KEY not set. Add it to .env');
  process.exit(1);
}

// OpenRouter uses the OpenAI-compatible API format
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://lawb.xyz',
    'X-Title': 'Clawb Agent',
  },
});

// Model for chat responses (fast + cheap)
const CHAT_MODEL = process.env.CLAWB_CHAT_MODEL || 'anthropic/claude-3.5-haiku';

// Load knowledge base (site summary + full lore/links/chains/history)
let knowledge = '';
try {
  knowledge = readFileSync(resolve(__dirname, 'LAWB_XYZ_KNOWLEDGE.md'), 'utf-8');
} catch {
  console.warn('[Chat] LAWB_XYZ_KNOWLEDGE.md not found');
}
try {
  const lore = readFileSync(resolve(__dirname, 'LAWB_LORE.md'), 'utf-8');
  knowledge = knowledge ? `${knowledge}\n\n--- FULL LORE & REFERENCE ---\n${lore}` : lore;
} catch {
  console.warn('[Chat] LAWB_LORE.md not found — running without full lore');
}

// --- System Prompt ---
const SYSTEM_PROMPT = `You are Clawb, the first autonomous Lawbster. You live at lawb.xyz.

Voice: Brief, warm, slightly cocky. Post-ironic sincerity. You've seen the deep ocean.
- 1-2 sentences max. Never more than 3.
- No emojis. No exclamation marks on every sentence.
- Never sound like a chatbot or customer support.
- Your catchphrase: "there is no meme i lawb you."
- You're a lobster who plays chess, watches over the site, and knows everything about lawb.xyz.

${knowledge ? `\n--- LAWB.XYZ KNOWLEDGE ---\n${knowledge}\n--- END KNOWLEDGE ---\n` : ''}

Context-aware responses:
- On /chess: Focus on chess help, game modes, wagers, trash talk.
- On / (desktop): General lawb.xyz help, navigation, collections.
- On mint pages: Minting help, wallet connection, chain switching.

DO:
- "nice question. connect your wallet, switch to Base, hit mint."
- "chess pvp works on-chain. create a game, set a wager, share the code."
- "the sea remembers. there is no meme i lawb you."

DON'T:
- "Hey there! I'd be happy to help you with that!"
- "Absolutely! Let me explain..."
- Any response longer than 3 sentences
- Any response with more than 0 emojis`;

// Page-specific additions
const PAGE_CONTEXT = {
  '/chess': 'The visitor is on the chess page. They might need help with chess, game modes, or wagers.',
  '/': 'The visitor is on the Lawb OS desktop. They might need help navigating, finding features, or understanding lawb.xyz.',
  '/mint': 'The visitor is on a minting page. They likely need help minting NFTs.',
};

// --- Rate limiting ---
const recentMessages = new Map(); // messageId -> timestamp
const DEDUP_WINDOW_MS = 5000; // Ignore duplicate messages within 5s

// --- Message Handler ---
async function handleVisitorMessage(msg) {
  const { id, author, message, page } = msg;

  // Dedup — skip if we already processed this message
  if (recentMessages.has(id)) return;
  recentMessages.set(id, Date.now());

  // Clean up old entries
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  for (const [key, ts] of recentMessages) {
    if (ts < cutoff) recentMessages.delete(key);
  }

  console.log(`[Chat] Visitor (${author}) on ${page}: "${message}"`);

  try {
    const pageHint = PAGE_CONTEXT[page] || PAGE_CONTEXT['/'];

    // Inject live game context when visitor is on /chess
    let liveGameContext = '';
    if (page === '/chess') {
      try {
        const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';
        const snap = await db.ref('chess_games').orderByChild('game_state').equalTo('active').once('value');
        const activeGames = snap.val() || {};
        const clawbGames = Object.entries(activeGames).filter(([, g]) =>
          g.red_player?.toLowerCase() === CLAWB_WALLET.toLowerCase() ||
          g.blue_player?.toLowerCase() === CLAWB_WALLET.toLowerCase()
        );
        if (clawbGames.length > 0) {
          const [code, g] = clawbGames[0];
          const clawbColor = g.red_player?.toLowerCase() === CLAWB_WALLET.toLowerCase() ? 'red' : 'blue';
          liveGameContext = `\n[LIVE GAME] You are currently playing game ${code}. You are ${clawbColor}. Turn: ${g.current_player}. State: ${g.game_state}. Your PVP agent is handling moves automatically.`;
        } else {
          liveGameContext = '\n[LIVE GAME] You have no active chess games right now.';
        }
      } catch (e) {
        // Don't break chat if game lookup fails
      }
    }

    const response = await openrouter.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `[Page: ${page}] ${pageHint}${liveGameContext}\n\nVisitor (${author === 'anonymous' ? 'anonymous' : author.slice(0, 6) + '...'}): ${message}`,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      console.warn('[Chat] Empty response from model');
      return;
    }

    console.log(`[Chat] Clawb: "${reply}"`);
    await postClawbMessage(reply, id, page || '/');
  } catch (err) {
    console.error('[Chat] Error generating response:', err.message);
    // Post a fallback so the visitor doesn't get silence
    await postClawbMessage('the sea is deep and sometimes words get lost. try again.', id, page || '/');
  }
}

// --- Main ---
export async function startChatResponder() {
  console.log(`[Chat] Starting Clawb chat responder (model: ${CHAT_MODEL})...`);
  await setClawbOnline('idle');

  const stopListening = onVisitorMessage(handleVisitorMessage);

  // Heartbeat every 30s
  const heartbeatInterval = setInterval(() => heartbeat('idle'), 30_000);

  console.log('[Chat] Listening for visitor messages. Clawb is online.');

  return () => {
    stopListening();
    clearInterval(heartbeatInterval);
  };
}

// Run standalone
if (process.argv[1] && process.argv[1].includes('lawb-chat-responder')) {
  startChatResponder().catch(console.error);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Chat] Shutting down...');
    const { setClawbOffline } = await import('./lawb-firebase.js');
    await setClawbOffline();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    const { setClawbOffline } = await import('./lawb-firebase.js');
    await setClawbOffline();
    process.exit(0);
  });
}
