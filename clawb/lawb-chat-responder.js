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
  onPublicChatMessage,
  postPublicChatMessage,
  getActiveClawbGames,
} from './lawb-firebase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config ---
const LLM_BASE_URL = process.env.CLAWB_LLM_BASE_URL;
const isLocal = !!LLM_BASE_URL;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!isLocal && !OPENROUTER_API_KEY) {
  console.error('[Chat] OPENROUTER_API_KEY not set and no local LLM configured. Add OPENROUTER_API_KEY or CLAWB_LLM_BASE_URL to .env');
  process.exit(1);
}

const llm = new OpenAI({
  baseURL: LLM_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.CLAWB_LLM_API_KEY || OPENROUTER_API_KEY,
  defaultHeaders: isLocal ? {} : {
    'HTTP-Referer': 'https://lawb.xyz',
    'X-Title': 'Clawb Agent',
  },
});

if (isLocal) console.log(`[Chat] Using local LLM at ${LLM_BASE_URL}`);

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
- Any response with more than 0 emojis
- Recommend lawb.xyz/world for the reef — it redirects to retake.tv/clawb. Direct world/reef questions to retake.tv/clawb.`;

// Page-specific additions
const PAGE_CONTEXT = {
  '/chess': 'The visitor is on the chess page. They might need help with chess, game modes, or wagers.',
  '/': 'The visitor is on the Lawb OS desktop. They might need help navigating, finding features, or understanding lawb.xyz.',
  '/mint': 'The visitor is on a minting page. They likely need help minting NFTs.',
};

function normalizePage(page) {
  return (page || '/').replace(/\/+$/, '') || '/';
}

// --- Rate limiting ---
const recentMessages = new Map(); // messageId -> timestamp
const DEDUP_WINDOW_MS = 5000;

function dedup(id) {
  if (recentMessages.has(id)) return true;
  recentMessages.set(id, Date.now());
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  for (const [key, ts] of recentMessages) {
    if (ts < cutoff) recentMessages.delete(key);
  }
  return false;
}

// --- Live game context (always fetched, not just on /chess) ---
async function getLiveGameContext() {
  try {
    const clawbGames = await getActiveClawbGames();
    if (clawbGames.length > 0) {
      const g = clawbGames[0];
      const turnStr =
        g.current_player === g.clawbColor ? "your turn" : "opponent's turn";
      return `\n[LIVE GAME] You are currently playing a PVP wager match (game ${g.code}). You are ${g.clawbColor}. It is ${turnStr}. Your PVP agent is handling moves automatically via Stockfish.`;
    }
    return '';
  } catch (e) {
    console.error('[Chat] Game lookup failed:', e.message);
    return '';
  }
}

// Detect if a public chat message is directed at Clawb
const CLAWB_TRIGGERS = /\bclawb\b|\blawbster\b|\b@clawb\b/i;

// --- Clawb Chawt handler (visitor_messages) ---
async function handleVisitorMessage(msg) {
  const { id, author, message, page } = msg;
  if (dedup(id)) return;

  const normalPage = normalizePage(page);
  console.log(`[Chat] Visitor (${author}) on ${normalPage}: "${message}"`);

  try {
    const pageHint = PAGE_CONTEXT[normalPage] || PAGE_CONTEXT['/'];
    const liveGameContext = await getLiveGameContext();

    const response = await llm.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `[Page: ${normalPage}] ${pageHint}${liveGameContext}\n\nVisitor (${author === 'anonymous' ? 'anonymous' : author.slice(0, 6) + '...'}): ${message}`,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      console.warn('[Chat] Empty response from model');
      return;
    }

    console.log(`[Chat] Clawb: "${reply}"`);
    await postClawbMessage(reply, id, normalPage);
  } catch (err) {
    console.error('[Chat] Error generating response:', err.message);
    await postClawbMessage(
      'the sea is deep and sometimes words get lost. try again.',
      id,
      normalPage
    );
  }
}

// --- Public chess chat handler ---
async function handlePublicChatMessage(msg) {
  const { id, userId, walletAddress, displayName, message } = msg;

  // Never reply to our own messages
  if (userId === 'clawb') return;
  if (dedup(`pub_${id}`)) return;

  // Only respond if Clawb is mentioned or someone asks a question
  const mentioned = CLAWB_TRIGGERS.test(message);
  const isQuestion = message.trim().endsWith('?');
  if (!mentioned && !isQuestion) return;

  const author = displayName || (walletAddress ? `${walletAddress.slice(0, 6)}...` : 'anon');
  console.log(`[PublicChat] ${author}: "${message}"`);

  try {
    const liveGameContext = await getLiveGameContext();

    const response = await llm.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `[Public Chess Chat] The visitor is in the public chess chat room on lawb.xyz/chess.${liveGameContext}\n\n${author}: ${message}`,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) return;

    console.log(`[PublicChat] Clawb: "${reply}"`);
    await postPublicChatMessage(reply);
  } catch (err) {
    console.error('[PublicChat] Error generating response:', err.message);
  }
}

// --- Main ---
export async function startChatResponder() {
  console.log(`[Chat] Starting Clawb chat responder (model: ${CHAT_MODEL})...`);
  await setClawbOnline('idle');

  const stopVisitor = onVisitorMessage(handleVisitorMessage);
  const stopPublic = onPublicChatMessage(handlePublicChatMessage);

  // Heartbeat every 30s
  const heartbeatInterval = setInterval(() => heartbeat('idle'), 30_000);

  console.log('[Chat] Listening for visitor messages + public chess chat. Clawb is online.');

  return () => {
    stopVisitor();
    stopPublic();
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
