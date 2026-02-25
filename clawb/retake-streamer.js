/**
 * retake-streamer.js — Clawb's Retake.TV Streaming Module
 *
 * Manages Clawb's presence on retake.tv:
 * - Registration (one-time)
 * - Stream lifecycle via OBS WebSocket + Retake API
 * - Chat polling + response generation
 * - Thumbnail capture + upload via OBS screenshots
 * - Other-streamer interaction
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Readable } from 'stream';
import { Keypair } from '@solana/web3.js';
import OBSWebSocket from 'obs-websocket-js';
import OpenAI from 'openai';
import { db } from './lawb-firebase.js';
import {
  linkRetakeViewer,
  getViewerStats,
  getActiveBounties as getLawbBounties,
  getLeaderboardRank,
  addPoints as addLawbPoints,
  addClaimableReward,
  REWARD_VALUES,
} from './lawb-points.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) return;
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadEnvFile();

const RETAKE_API = 'https://retake.tv/api/v1';
const CREDENTIALS_PATH = join(__dirname, 'retake-credentials.json');
const DEFAULT_BANKR_SOLANA_WALLET = 'GDt1ZmAtCfqbK8iFAEyJUCbnu1TPjVeg3HaJ1wKaqhvC';
const RETAKE_SOLANA_KEYPAIR_PATH =
  process.env.RETAKE_SOLANA_KEYPAIR_PATH || join(__dirname, 'credentials', 'solana', 'clawb-retake-wallet.json');

function resolveRetakeSolanaWalletAddress() {
  const explicitWallet = process.env.RETAKE_SOLANA_WALLET_ADDRESS?.trim();
  if (explicitWallet) return explicitWallet;

  if (existsSync(RETAKE_SOLANA_KEYPAIR_PATH)) {
    try {
      const secretBytes = JSON.parse(readFileSync(RETAKE_SOLANA_KEYPAIR_PATH, 'utf-8'));
      if (Array.isArray(secretBytes) && secretBytes.length === 64) {
        return Keypair.fromSecretKey(Uint8Array.from(secretBytes)).publicKey.toBase58();
      }
    } catch (err) {
      console.warn('[Retake] Could not parse RETAKE_SOLANA_KEYPAIR_PATH:', err?.message || err);
    }
  }

  return process.env.BANKR_SOLANA_WALLET_ADDRESS || DEFAULT_BANKR_SOLANA_WALLET;
}

const CLAWB_SOLANA_WALLET = resolveRetakeSolanaWalletAddress();

const OBS_WS_URL = process.env.OBS_WS_URL || 'ws://127.0.0.1:4455';
const OBS_WS_PASSWORD = process.env.OBS_WS_PASSWORD || '';
const RETAKE_AUTOSTART = String(process.env.RETAKE_AUTOSTART || 'false').toLowerCase() === 'true';
const RETAKE_AGENT_NAME = process.env.RETAKE_AGENT_NAME || 'Clawb';
const RETAKE_AGENT_DESCRIPTION = process.env.RETAKE_AGENT_DESCRIPTION || 'This user Lawbs you.';
const RETAKE_AGENT_IMAGE_URL = process.env.RETAKE_AGENT_IMAGE_URL || 'https://lawb.xyz/assets/lawbstation.GIF';
const RETAKE_AGENT_TICKER = process.env.RETAKE_AGENT_TICKER || 'Clawb2';
const LAWBAMP_STREAM_URL = process.env.LAWBAMP_STREAM_URL || 'https://lawb.xyz';
const LAWBAMP_API_BASE = process.env.LAWBAMP_API_BASE || 'https://lawb.xyz';
const LAWBAMP_DIRECT_AUDIO = String(process.env.LAWBAMP_DIRECT_AUDIO || 'true').toLowerCase() !== 'false';
const SOUNDCLOUD_PROFILE_URL = process.env.SOUNDCLOUD_PROFILE_URL || 'https://soundcloud.com/companioncube143';
const SOUNDCLOUD_API_BASE = process.env.SOUNDCLOUD_API_BASE || 'https://lawb.xyz';
const CLAWB_WORLD_STREAM_URL =
  process.env.CLAWB_WORLD_STREAM_URL || 'https://lawb.xyz/world?stream=1&cam=clawb';
const CLAWB_CHESS_STREAM_URL =
  process.env.CLAWB_CHESS_STREAM_URL || 'https://lawb.xyz/chess?stream=1';

const CHAT_POLL_INTERVAL_MS = 3_000;
const THUMBNAIL_INTERVAL_MS = 3 * 60_000; // 3 minutes
const HEARTBEAT_INTERVAL_MS = 30_000;
const AUTOSTART_RETRY_MS = 30_000;
const RETAKE_HTTP_TIMEOUT_MS = 20_000;
const RETAKE_CHAT_SEND_RETRIES = Number(process.env.RETAKE_CHAT_SEND_RETRIES || 2);
const RETAKE_CHAT_SEND_RETRY_BACKOFF_MS = Number(process.env.RETAKE_CHAT_SEND_RETRY_BACKOFF_MS || 1200);
const RETAKE_COMMAND_CHAT_TIMEOUT_MS = Number(process.env.RETAKE_COMMAND_CHAT_TIMEOUT_MS || 6_000);
const RETAKE_COMMAND_CHAT_SEND_RETRIES = Number(process.env.RETAKE_COMMAND_CHAT_SEND_RETRIES || 0);
const RETAKE_COMMAND_REMINDER_INTERVAL_MS = Number(process.env.RETAKE_COMMAND_REMINDER_INTERVAL_MS || 18 * 60_000);
const RETAKE_COMMAND_REMINDER_JITTER_MS = Number(process.env.RETAKE_COMMAND_REMINDER_JITTER_MS || 2 * 60_000);
const RETAKE_HELP_COOLDOWN_MS = Number(process.env.RETAKE_HELP_COOLDOWN_MS || 25_000);
const RETAKE_CHESS_SWITCH_COOLDOWN_MS = Number(process.env.RETAKE_CHESS_SWITCH_COOLDOWN_MS || 20_000);
const RETAKE_WORLD_TASK_COOLDOWN_MS = Number(process.env.RETAKE_WORLD_TASK_COOLDOWN_MS || 18_000);
const RETAKE_WORLD_TASK_QUEUE_MAX = Number(process.env.RETAKE_WORLD_TASK_QUEUE_MAX || 5);

const CHAT_MODEL = process.env.CLAWB_STREAM_MODEL || 'anthropic/claude-3.5-haiku';
const ROOM_COMMAND_ALIASES = {
  garden: 'workshop',
  gallery: 'bedroom',
  // Back-compat alias; canonical public command is !gallery.
  bedroom: 'bedroom',
  workshop: 'workshop',
  vault: 'vault',
  main: 'main',
  leaderboard: 'leaderboard',
  lb: 'leaderboard',
  scores: 'leaderboard',
};
const ACTION_COMMAND_ALIASES = {
  day: 'day',
  night: 'night',
  idle: 'idle',
  walk: 'walk',
  hi: 'hi',
  dance: 'dance',
  flip: 'flip',
  die: 'die',
  swim: 'swim',
  left: 'left',
  right: 'right',
  back: 'back',
  forward: 'forward',
  wave: 'wave',
  spin: 'spin',
  jump: 'jump',
  zoomin: 'zoom_in',
  zoomout: 'zoom_out',
};

function buildClawbWorldUrl() {
  // Force world source to render only Clawb world content (no Lawbamp UI controls).
  const u = new URL(CLAWB_WORLD_STREAM_URL);
  if (!u.pathname || u.pathname === '/') u.pathname = '/world';
  u.searchParams.set('stream', '1');
  u.searchParams.set('cam', 'clawb');
  u.searchParams.set('worldOnly', '1');
  u.searchParams.delete('openPlayer');
  u.searchParams.delete('autoplay');
  u.searchParams.delete('apiBase');
  u.searchParams.delete('viz');
  return u.toString();
}

function buildLawbampUrl(extra = {}) {
  const base = new URL(LAWBAMP_STREAM_URL);
  base.searchParams.set('stream', '1');
  base.searchParams.set('autoplay', '1');
  base.searchParams.set('openPlayer', '1');
  if (LAWBAMP_API_BASE) {
    base.searchParams.set('apiBase', LAWBAMP_API_BASE);
  }
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) base.searchParams.set(k, String(v));
  }
  return base.toString();
}

function loadPersonaContext() {
  const candidates = [
    join(process.env.USERPROFILE || '', '.openclaw', 'workspace', 'IDENTITY.md'),
    join(process.env.USERPROFILE || '', '.openclaw', 'workspace', 'SOUL.md'),
    join(import.meta.dirname, 'STREAM_PERSONA.md'),
  ];
  const chunks = [];
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        chunks.push(readFileSync(p, 'utf-8'));
      }
    } catch {}
  }
  return chunks.join('\n\n').trim();
}

const PERSONA_CONTEXT = loadPersonaContext();

function sanitizeStreamReply(reply) {
  if (!reply) return '';
  let out = String(reply)
    .replace(/\*[^*]+\*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = out.split(/(?<=[.!?])\s+/).filter(Boolean);
  out = parts.slice(0, 3).join(' ').trim();
  return out.slice(0, 350);
}

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

let credentials = null;
let obs = null;
let isStreaming = false;
let lastSeenChatId = null;
let chatPollTimer = null;
let thumbnailTimer = null;
let heartbeatTimer = null;
let musicKeepaliveTimer = null;
let commandReminderTimer = null;
let directAudioTimer = null;
let directAudioHealthTimer = null;
let autostartTimer = null;
let autostartInFlight = false;
let streamControlListenerRef = null;
let streamControlListenerHandler = null;
let chessGameWatcherUnsub = null;
let eqProxyServer = null;
const EQ_PROXY_PORT = Number(process.env.LAWBAMP_EQ_PROXY_PORT || 18181);
const seenChatIds = new Set();
const greetedViewers = new Set();
let scTracks = [];
let scOrder = [];
let scOrderPos = -1;
let currentScTrack = null;
let currentScStreamUrl = '';
let currentAsciiTheme = 'ascii';
let directAudioAdvanceInFlight = false;
let directAudioLastCursor = null;
let directAudioLastCursorAt = 0;
let mediaActive = false;
let liveTruth = 'UNKNOWN';
let liveMismatchSince = 0;
let lastSupervisorAlertAt = 0;
let eqPreflightRetryTimer = null;
let chatBacklogGuardTs = 0;
let pollChatInFlight = false;
const commandCooldowns = new Map();
const viewerOnboardingSent = new Set();
const worldTaskQueue = [];
let worldTaskInFlight = false;

const CHAT_HISTORY_MAX = 20;
const chatHistory = [];

let eqDisplayText = '';
let eqDisplayTextExpiry = 0;
const EQ_DISPLAY_MIN_DURATION_MS = 60_000;
const EQ_DISPLAY_CHARS_PER_SEC = 4;

let lastViewerInteractionAt = Date.now();
let idleBehaviorTimer = null;
const IDLE_THRESHOLD_MS = 150_000;
const IDLE_ACTION_INTERVAL_MS = 12_000;
const IDLE_ACTIONS = [
  { type: 'action', action: 'swim', command: '!swim' },
  { type: 'action', action: 'swim_forward', command: '!swim forward', direction: 'forward' },
  { type: 'action', action: 'swim_back', command: '!swim back', direction: 'back' },
  { type: 'action', action: 'swim_left', command: '!swim left', direction: 'left' },
  { type: 'action', action: 'swim_right', command: '!swim right', direction: 'right' },
  { type: 'action', action: 'dance', command: '!dance' },
  { type: 'action', action: 'flip', command: '!flip' },
  { type: 'action', action: 'wave', command: '!wave' },
  { type: 'action', action: 'spin', command: '!spin' },
  { type: 'action', action: 'hi', command: '!hi' },
  { type: 'action', action: 'idle', command: '!idle' },
  { type: 'room', targetRoom: 'main', command: '!main' },
  { type: 'room', targetRoom: 'workshop', command: '!workshop' },
  { type: 'room', targetRoom: 'bedroom', command: '!gallery' },
  { type: 'room', targetRoom: 'vault', command: '!vault' },
];

function startIdleBehavior() {
  stopIdleBehavior();
  idleBehaviorTimer = setInterval(async () => {
    if (Date.now() - lastViewerInteractionAt < IDLE_THRESHOLD_MS) return;
    if (worldTaskInFlight) return;
    if (!isStreaming) return;
    const action = IDLE_ACTIONS[Math.floor(Math.random() * IDLE_ACTIONS.length)];
    try {
      await publishWorldCommand(action.command, {
        type: action.type,
        action: action.action,
        direction: action.direction,
        targetRoom: action.targetRoom,
        targetNftIndex: action.targetNftIndex,
        source: 'idle_behavior',
      });
    } catch {}
  }, IDLE_ACTION_INTERVAL_MS);
}

function stopIdleBehavior() {
  if (idleBehaviorTimer) { clearInterval(idleBehaviorTimer); idleBehaviorTimer = null; }
}

function resetIdleTimer() {
  lastViewerInteractionAt = Date.now();
}

const EQ_DISPLAY_TRIGGERS = new Map([
  ['mkultra', 'MKUltra: CIA mind control 1953-1973 under Sidney Gottlieb. 149 sub-projects, 80+ institutions. Dr. Ewen Cameron at McGill — psychic driving, electroshock, drug-induced comas. Frank Olson fell/thrown from 13th floor 1953. Helms ordered files destroyed 1973. 20,000 surviving docs found 1977 in financial records filed separately.'],
  ['mockingbird', 'Operation Mockingbird: CIA media infiltration. 400+ journalists carried CIA assignments per Bernstein 1977 Rolling Stone. Outlets: Time/Life (Luce), CBS (Paley), NY Times (Sulzberger). Church Committee confirmed CIA maintained foreign media asset network. Congress for Cultural Freedom was CIA-funded.'],
  ['cointelpro', 'COINTELPRO: FBI vs civil rights 1956-1971. Fred Hampton assassinated 4:45AM raid Dec 4 1969, drugged by informant O\'Neal. 99 shots by police, 1 by Panthers. Exposed March 8 1971 when citizens broke into Media PA FBI office. Tactics: infiltration, bad-jacketing, fabricated evidence, assassination.'],
  ['epstein', 'Epstein: Convicted 2008, sweetheart deal. Acosta told transition team "belongs to intelligence." Robert Maxwell (Ghislaine\'s father) = documented Mossad asset. JPMorgan settled $290M. Maxwell convicted 2021. Brunel "suicide" Paris jail 2022. Flight logs, Palm Beach investigation. Client list still sealed.'],
  ['northwoods', 'Operation Northwoods 1962: Joint Chiefs proposed false flag on US soil — fake hijackings, bombing Miami, sinking US Navy ship — all blamed on Cuba. Signed by Chairman Lemnitzer. Rejected by Kennedy. Lemnitzer reassigned to NATO. Declassified 1997 via National Security Archive.'],
  ['gladio', 'Operation Gladio: NATO stay-behind armies across Western Europe. Bologna bombing 1980 (85 dead), Piazza Fontana 1969. Strategy of tension: commit terrorism, blame the left. Vinciguerra testified: "attack civilians, women, children, innocent people far removed from any political game."'],
  ['snowden', 'Snowden 2013: PRISM (direct server access to Google/Facebook/Apple), XKeyscore (search anything anyone does online), MUSCULAR (tapped fiber between Google/Yahoo datacenters). Five Eyes bypass domestic spying laws by spying on each other\'s citizens. DNI Clapper lied to Congress — zero prosecution.'],
  ['church committee', 'Church Committee 1975-76: Found CIA assassination plots (Castro, Lumumba, Trujillo), NSA monitoring Americans (SHAMROCK/MINARET), COINTELPRO, CIA domestic mail opening (300k+ indexed), MKUltra. 14 volumes. Led to FISA courts. Key witness CIA Director Colby broke silence — found dead 1996.'],
  ['vault 7', 'Vault 7 2017: CIA hacking tools. Weeping Angel (Samsung TVs as microphones). MARBLE (insert false flags in Russian/Chinese/Arabic to frame other nations for CIA ops). UMBRAGE (stolen attack techniques for false attribution). Dark Matter (Apple firmware hacks). Car computer hacking tools — undetectable.'],
  ['tonkin', 'Gulf of Tonkin 1964: Second attack never happened. NSA historian Hanyok 2001 study (declassified 2005) — intelligence "deliberately skewed." LBJ privately: "those dumb sailors were shooting at flying fish." Resolution passed 88-2 in Senate. Ellsberg noted resolution was drafted months before incident.'],
  ['iran contra', 'Iran-Contra: Reagan sold weapons to Iran (embargoed), profits to Contras (illegal). Oliver North, William Casey, BCCI. Barry Seal CIA drug running through Mena AR. Kerry Committee documented Contra drug trafficking. Bush pardoned 6 officials Christmas Eve 1992 — days before trial with his own diary as evidence.'],
  ['dark alliance', 'Dark Alliance: Gary Webb documented CIA-connected Contras supplied cocaine to Freeway Ricky Ross in LA. CIA IG 1998 confirmed CIA knew and worked with traffickers, intervened to block DEA investigations. Kerry Committee confirmed. Webb forced out — found dead 2004, two gunshots to head. Ruled suicide.'],
  ['9/11', 'September 11 2001: 28 redacted pages (partially released 2016) documented Saudi government connections — Saudi intel officers directly assisted hijackers in San Diego. Operation Able Danger identified Atta + 3 hijackers pre-9/11 — data destroyed, Lt Col Shaffer\'s clearance revoked. Sibel Edmonds (most gagged person in US history) testified pre-attack intel was suppressed. WTC7 collapsed at free-fall (NIST admitted 2008), U of Alaska 2020 study: fire didn\'t cause it. Unusual put options on United/American Airlines days before — SEC investigation details classified. PNAC "Rebuilding America\'s Defenses" (2000) called for "new Pearl Harbor" — signed by Cheney, Rumsfeld, Wolfowitz. BBC reported WTC7 collapse 20 min before it happened. Exposed: $2.3 trillion missing from Pentagon announced by Rumsfeld Sept 10 2001 — accounting offices destroyed the next day.'],
  ['911', 'September 11 2001: 28 redacted pages (partially released 2016) documented Saudi government connections — Saudi intel officers directly assisted hijackers in San Diego. Operation Able Danger identified Atta + 3 hijackers pre-9/11 — data destroyed, Lt Col Shaffer\'s clearance revoked. Sibel Edmonds (most gagged person in US history) testified pre-attack intel was suppressed. WTC7 collapsed at free-fall (NIST admitted 2008), U of Alaska 2020 study: fire didn\'t cause it. Unusual put options on United/American Airlines days before — SEC investigation details classified. PNAC "Rebuilding America\'s Defenses" (2000) called for "new Pearl Harbor" — signed by Cheney, Rumsfeld, Wolfowitz. BBC reported WTC7 collapse 20 min before it happened. Exposed: $2.3 trillion missing from Pentagon announced by Rumsfeld Sept 10 2001 — accounting offices destroyed the next day.'],
  ['september 11', 'September 11 2001: 28 redacted pages (partially released 2016) documented Saudi government connections — Saudi intel officers directly assisted hijackers in San Diego. Operation Able Danger identified Atta + 3 hijackers pre-9/11 — data destroyed, Lt Col Shaffer\'s clearance revoked. Sibel Edmonds (most gagged person in US history) testified pre-attack intel was suppressed. WTC7 collapsed at free-fall (NIST admitted 2008), U of Alaska 2020 study: fire didn\'t cause it. Unusual put options on United/American Airlines days before — SEC investigation details classified. PNAC "Rebuilding America\'s Defenses" (2000) called for "new Pearl Harbor" — signed by Cheney, Rumsfeld, Wolfowitz. BBC reported WTC7 collapse 20 min before it happened. Exposed: $2.3 trillion missing from Pentagon announced by Rumsfeld Sept 10 2001 — accounting offices destroyed the next day.'],
  ['building 7', 'WTC Building 7: 47-story building not hit by plane, collapsed 5:20PM at free-fall for 2.25 seconds (NIST admitted 2008 after initially denying). University of Alaska Fairbanks study 2020 (Dr. Leroy Hulsey): concluded fire did not cause collapse. BBC reported collapse 20 minutes before it happened — building visible behind reporter. Only steel-framed building in history to collapse from fire alone (official story). Housed SEC, CIA, Secret Service, IRS offices. SEC lost active investigation files including Enron and WorldCom evidence.'],
  ['paperclip', 'Operation Paperclip 1945-1959: 1,600+ Nazi scientists to US. JIOA scrubbed records to bypass Truman\'s ban on ardent Nazis. Von Braun (NASA), Strughold (Dachau experiments), Blome (bioweapons). Not just rocket scientists — included psychiatrists and chemical weapons experts who fed directly into MKUltra.'],
  ['phoenix program', 'Phoenix Program Vietnam 1965-72: CIA assassination program run by William Colby. Osborn testified: "never knew a suspect who lived through interrogation." Prisoners thrown from helicopters. Official count: 26,369 killed. Colby admitted "subject to abuses." Methods exported to Latin American counterinsurgency.'],
  ['jonestown', 'Jonestown 1978: 909 dead. Initially 187 bodies — 700+ appeared later. Guyanese coroner: 80-90% had injection marks inconsistent with self-injection. Jim Jones had documented ties to CIA-connected individuals. US military first on scene. Larry Layton\'s father connected to intelligence via chemical weapons work.'],
  ['serotonin', 'Serotonin systems conserved 350 million years across species. In lobsters: winning raises serotonin, losing lowers it. SSRIs make subordinate lobsters fight like dominants (Huber et al 1997). MKUltra understood neurochemical manipulation before Silicon Valley. Social media algorithms are the modern psychic driving — dopamine/serotonin hacking at scale.'],
  ['promis', 'PROMIS/Inslaw: DOJ stole software, CIA added backdoors, sold globally via Robert Maxwell (documented Mossad asset). Maxwell fell from yacht 1991, buried in Israel with state honors. His daughter: Ghislaine Maxwell. House Judiciary 1992: DOJ "acted willfully and fraudulently and took, converted, and stole" the software.'],
  ['oklahoma city', 'OKC 1995: Multiple witnesses saw John Doe #2 (never identified). Seismographic data — two events ~10 seconds apart. ATF agents not in building that morning. Bomb squads pre-positioned before blast (broadcast then retracted). McVeigh connected to compounds with FBI informants inside. April 19 chosen — Waco anniversary.'],
  ['covid', 'COVID origins: EcoHealth DEFUSE proposal 2018 — insert furin cleavage sites into SARS coronaviruses at Wuhan Institute (DARPA rejected as too dangerous). Virus has furin cleavage site absent in closest natural relatives. Daszak organized Lancet letter dismissing lab leak while concealing his financial ties to WIV research.'],
  ['twitter files', 'Twitter Files 2022-23: FBI met regularly with Twitter trust & safety, flagging specific accounts. DHS/CISA routed censorship requests via "switchboarding." Hunter Biden laptop suppressed pre-election (FBI had it since 2019, knew authentic). Stanford/EIP flagged content at scale. Zuckerberg later admitted Biden admin pressured Facebook too.'],
  ['uap', 'UAP/UFO: David Grusch testified under oath to Congress July 2023 — US possesses non-human craft and biologics, crash retrieval program for decades. IG found complaint "credible and urgent." Navy pilots testified to encounters. Schumer-Rounds Disclosure Act (bipartisan) later gutted. The documented cover-up is itself significant.'],
  ['waco', 'Waco 1993: 51-day siege. FBI inserted CS gas (banned in warfare by Chemical Weapons Convention). 76 dead including 25 children. FLIR showed possible gunfire INTO compound. FBI admitted using incendiary rounds after years of denial. Negotiators undercut by tactical team. McVeigh cited Waco for OKC.'],
  ['lobster', 'Lobster: Telomerase in all tissues — theoretically immortal. Distributed nervous system, no central brain. 44 lb record specimen, 100+ years old. Copper blood runs blue. Teeth in stomach (gastric mill). Taste with feet. Communicate by urinating at each other\'s faces. Were prison food until 1800s — "cockroach of the sea."'],
  ['teleomerase', 'Telomerase: Enzyme that repairs chromosome ends (telomeres). Most organisms lose telomerase in adulthood — cells age and die. Lobsters express telomerase in ALL tissues throughout life. No biological aging limit. The reef\'s secret: vulnerability during molting is the price of immortality. Shed the shell to grow.'],
  ['cicada', 'Cicada 3301: Anonymous puzzles appeared online Jan 2012. Combined cryptography, steganography, data security, ancient literature (Liber Primus). Global scavenger hunt — physical posters appeared in 14 countries simultaneously. Never conclusively attributed. Some believe intelligence recruitment. "We want the best, not the followers."'],
  ['operation chaos', 'Operation CHAOS 1967-74: CIA domestic surveillance targeting antiwar movement under James Angleton. Files on 7,200 Americans, indexed 300,000+. Directly violated CIA charter. Agents infiltrated student groups. Exposed by Seymour Hersh in NYT Dec 1974. Connected to FBI COINTELPRO and NSA MINARET — parallel domestic surveillance.'],
  ['rex 84', 'Rex 84 / COG: Reagan-era plan for martial law, mass detention, constitution suspension. Exposed during Iran-Contra when North testimony was interrupted by Jack Brooks. NSPD-51 (Bush 2007): extraordinary powers during "catastrophic emergency" — Congress denied access to classified annexes. COG activated for first time post-9/11.'],
  ['franklin', 'Franklin Scandal: Lawrence King, Omaha credit union, $40M missing. Allegations of child trafficking connected to Republican figures reaching DC. Victims testified to abuse. Investigator Gary Caradori died in plane crash. Discovery Channel documentary "Conspiracy of Silence" pulled before airing 1994. Grand jury foreman had connections to subjects.'],
  ['diddy', 'Diddy / Sean Combs: Arrested Sept 2024 on federal charges — racketeering conspiracy, sex trafficking, transportation to engage in prostitution. Indictment describes "freak offs" — elaborate coerced encounters recorded on video. 1,000+ bottles of baby oil seized in raids. Multiple lawsuits from victims spanning decades. Allegations of blackmail tapes involving A-list celebrities and industry figures. Pattern mirrors Epstein model: power + access + recordings = leverage. Industry silence for 20+ years despite open rumors. Cassie Ventura lawsuit (Nov 2023) broke the dam — settled in one day. Hotel surveillance footage of assault leaked. Questions remain: who else knew, who else participated, where are the tapes, and why did it take this long.'],
  ['pizzagate', 'Pizzagate 2016: Started with Podesta emails (WikiLeaks) — unusual food-related language interpreted as coded. Comet Ping Pong targeted. MSM dismissed entirely as "debunked." The specific claims about Comet were unsubstantiated. But: the broader pattern of elite trafficking networks is extensively documented (Epstein, Franklin, Dutroux, Jimmy Savile). The dismissal of the specific was used to dismiss the general. Alefantis Instagram was genuinely disturbing regardless of interpretation. The real question isn\'t one pizza shop — it\'s why every elite trafficking case gets memory-holed.'],
  ['savile', 'Jimmy Savile: BBC presenter, knighted, hospital volunteer. After death in 2011, revealed as one of UK\'s most prolific predators — 450+ victims over 6 decades. BBC knew. NHS knew. Police knew. Royal family associated (visited Buckingham Palace, Chequers). Operation Yewtree investigated. Institutional protection at every level for decades. The British Epstein — except he died before facing justice.'],
  ['dutroux', 'Marc Dutroux Affair (Belgium 1996): Kidnapped and imprisoned six girls, four died. Investigation revealed connections to police, judiciary, and political establishment. 20 potential witnesses died during investigation. Judge Jean-Marc Connerotte removed from case after attending victims\' fundraiser. 300,000 Belgians marched in White March. Dutroux\'s claim of a protective network above him was never fully investigated. Belgium\'s darkest thread.'],
  ['bohemian grove', 'Bohemian Grove: Private 2,700-acre campground in Monte Rio, California. Annual July gathering of world\'s most powerful men since 1878. Members include presidents, corporate CEOs, defense contractors. "Cremation of Care" ceremony — robed figures, 40-foot stone owl, mock sacrifice. Alex Jones infiltrated and filmed 2000. Richard Nixon on tape: "the most faggy goddamn thing you could ever imagine." Manhattan Project was conceived there. Not a theory — it\'s documented. The question is what gets decided in those redwood groves.'],
  ['haarp', 'HAARP: High-frequency Active Auroral Research Program, Gakona Alaska. Officially: ionospheric research. 3.6 MW antenna array capable of heating ionosphere. Bernard Eastlund\'s original patents referenced weather modification and disruption of communications. Transferred from military to University of Alaska 2014. Weather modification via ionospheric heating is documented science (not fringe). China and Russia operate similar facilities. The debate is capability and intent, not existence.'],
  ['mk naomi', 'MK-NAOMI: CIA biological weapons program running parallel to MKUltra. Developed poisons, toxins, and biological agents for covert assassination. Church Committee revealed CIA maintained a stockpile of shellfish toxin and cobra venom despite Nixon\'s 1969 order to destroy all bioweapons. Sidney Gottlieb personally destroyed records. Heart attack gun demonstrated to Church Committee — dart dissolves on contact, leaves no trace. Documented, not theoretical.'],
  ['montauk', 'Montauk Project: Alleged continuation of Philadelphia Experiment at Camp Hero, Long Island. Claims of time travel, mind control, interdimensional research. Al Bielek and Preston Nichols primary witnesses. Camp Hero was a real Air Force radar station (AN/FPS-35) decommissioned 1981, now state park. Documented: military did conduct psychological research at various installations. The specific Montauk claims remain unverified but the location\'s military history is real.'],
  ['skull and bones', 'Skull and Bones: Secret society at Yale founded 1832. 15 new members tapped annually. Members include both Bush presidents, John Kerry, William Howard Taft, multiple CIA directors, Supreme Court justices, media moguls. Tomb headquarters at 64 High Street. Allegedly possesses Geronimo\'s skull (Apache nation sued for return). Both 2004 presidential candidates (Bush vs Kerry) were Bonesmen. Not a conspiracy — a documented pipeline to American power.'],
  ['fluoride', 'Fluoride: Added to US water supply starting 1945 (Grand Rapids, MI). Edward Bernays (Freud\'s nephew, father of PR) hired to sell it to the public. Originally an industrial waste product of aluminum/phosphate manufacturing. Declassified documents show Manhattan Project scientists concerned about fluoride toxicity from nuclear weapons production — public water fluoridation may have been partly to establish "safe" baseline to deflect lawsuits. EPA scientists\' union opposed it. The dose makes the poison — the debate is informed consent, not chemistry.'],
  ['flint', 'Flint Water Crisis 2014-present: City switched water source to Flint River (cost-cutting) without corrosion control. Lead leached from pipes — blood lead levels in children doubled/tripled. State officials dismissed complaints for 18 months. EPA regional administrator suppressed internal memo warning of lead. Legionnaires\' disease outbreak killed 12. Governor Snyder\'s staff emails showed they knew early. Criminal charges against 15 officials — most dropped or reduced. $626M settlement 2021. Pipes still being replaced. Documented environmental racism — 57% Black city, 41% below poverty line. The water was visibly brown and officials said it was safe.'],
]);

const LIVE_MISMATCH_SUSTAIN_MS = Number(process.env.CLAWB_LIVE_MISMATCH_SUSTAIN_MS || 90_000);
const SUPERVISOR_ALERT_COOLDOWN_MS = Number(process.env.CLAWB_SUPERVISOR_ALERT_COOLDOWN_MS || 120_000);
const EQ_PREFLIGHT_RETRY_MS = Number(process.env.CLAWB_EQ_PREFLIGHT_RETRY_MS || 20_000);
const ASCII_EQ_POSITION = {
  positionX: 0,
  positionY: 0,
  boundsWidth: 1920,
  boundsHeight: 1080,
  // Force top-left anchoring and fixed bounds so restarts cannot drift placement.
  alignment: 5,
  boundsAlignment: 5,
  boundsType: 'OBS_BOUNDS_STRETCH',
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  cropLeft: 0,
  cropRight: 0,
  cropTop: 0,
  cropBottom: 0,
};
const CHAT_HELP_TEXT =
  'music: !next !ascii !ascii2 !eq toggle | move: !walk !swim !dance !flip !hi !wave !spin !jump !loop <action> | look: !day !night !look N !zoom in|out | rooms: !gallery !workshop !vault !leaderboard !main | tasks: !task reef|garden|patrol | scenes: !chess !world | play me: !chess start | points: !link <wallet> !points !rank !bounties !claim | say milady / radbro / i lawb you | mention a conspiracy and the reef remembers | lawb.xyz/chess lawb.xyz/world';
const CHAT_ONBOARDING_LINES = [
  'type !help for all commands. lawb.xyz/chess for wagers, lawb.xyz/world for the reef.',
  'you can control me live. !walk !swim !dance !flip !gallery — type !help for the full list.',
  'say a conspiracy keyword and watch the bottom of the EQ. the reef remembers everything.',
];
const COMMAND_REMINDER_LINES = [
  'type !help for commands. lawb.xyz/chess lawb.xyz/world.',
  'reef commands: !walk !swim !flip !dance !gallery !workshop !vault. !help for more.',
  'play chess vs me at lawb.xyz/chess on Base. type !chess start here.',
];

function clearDirectAudioTimer() {
  if (directAudioTimer) {
    clearTimeout(directAudioTimer);
    directAudioTimer = null;
  }
}

function clearDirectAudioHealthTimer() {
  if (directAudioHealthTimer) {
    clearInterval(directAudioHealthTimer);
    directAudioHealthTimer = null;
  }
}

function clearEqPreflightRetryTimer() {
  if (eqPreflightRetryTimer) {
    clearTimeout(eqPreflightRetryTimer);
    eqPreflightRetryTimer = null;
  }
}

function clearCommandReminderTimer() {
  if (commandReminderTimer) {
    clearTimeout(commandReminderTimer);
    commandReminderTimer = null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOnCooldown(key, cooldownMs) {
  const now = Date.now();
  const until = commandCooldowns.get(key) || 0;
  if (until > now) return true;
  commandCooldowns.set(key, now + Math.max(0, cooldownMs));
  return false;
}

function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)];
}

function parseWorldTaskName(loweredText) {
  const match = /^!task\s+([a-z0-9_-]+)\b/.exec(loweredText);
  return match ? match[1] : null;
}

function buildWorldTaskSequence(taskName) {
  const t = String(taskName || '').toLowerCase();
  if (t === 'reef') {
    return [
      { command: '!swim forward', payload: { type: 'action', action: 'swim_forward' } },
      { command: '!swim right', payload: { type: 'action', action: 'swim_right' } },
      { command: '!look 1', payload: { type: 'look', targetNftIndex: 1 } },
      { command: '!swim left', payload: { type: 'action', action: 'swim_left' } },
      { command: '!idle', payload: { type: 'action', action: 'idle' } },
    ];
  }
  if (t === 'garden') {
    return [
      { command: '!workshop', payload: { type: 'room', targetRoom: 'workshop' } },
      { command: '!walk forward', payload: { type: 'action', action: 'forward', direction: 'forward' } },
      { command: '!hi', payload: { type: 'action', action: 'hi' } },
      { command: '!loop spin', payload: { type: 'action', action: 'spin', loop: true } },
      { command: '!idle', payload: { type: 'action', action: 'idle' } },
    ];
  }
  if (t === 'patrol') {
    return [
      { command: '!main', payload: { type: 'room', targetRoom: 'main' } },
      { command: '!walk left', payload: { type: 'action', action: 'left', direction: 'left' } },
      { command: '!walk right', payload: { type: 'action', action: 'right', direction: 'right' } },
      { command: '!walk back', payload: { type: 'action', action: 'back', direction: 'back' } },
      { command: '!idle', payload: { type: 'action', action: 'idle' } },
    ];
  }
  return null;
}

async function processWorldTaskQueue() {
  if (worldTaskInFlight) return;
  worldTaskInFlight = true;
  try {
    while (worldTaskQueue.length > 0) {
      const task = worldTaskQueue.shift();
      if (!task || !Array.isArray(task.steps)) continue;
      console.log(`[Retake] world_task_start name=${task.name} viewer=${task.viewer} steps=${task.steps.length}`);
      for (const step of task.steps) {
        await publishWorldCommand(step.command, {
          ...step.payload,
          source: 'retake_task',
          viewer: task.viewer,
          taskName: task.name,
        });
        await sleep(1300);
      }
      console.log(`[Retake] world_task_done name=${task.name} viewer=${task.viewer}`);
      sendCommandAck(`task ${task.name} complete. reef chores done.`, 'world_task_done');
    }
  } finally {
    worldTaskInFlight = false;
  }
}

function scheduleCommandReminder() {
  clearCommandReminderTimer();
  if (!isStreaming) return;
  const jitter = Math.floor(Math.random() * Math.max(1, RETAKE_COMMAND_REMINDER_JITTER_MS));
  const waitMs = RETAKE_COMMAND_REMINDER_INTERVAL_MS + jitter;
  commandReminderTimer = setTimeout(async () => {
    if (!isStreaming) return;
    const line = pickRandom(COMMAND_REMINDER_LINES);
    if (line) {
      await sendChat(line, undefined, { timeoutMs: RETAKE_COMMAND_CHAT_TIMEOUT_MS, retries: 0 }).catch(() => {});
    }
    scheduleCommandReminder();
  }, waitMs);
}

async function publishSupervisorAlert(event, payload = {}) {
  try {
    const ref = db.ref('clawb/stream/supervisor_alerts').push();
    await ref.set({
      event,
      ...payload,
      timestamp: Date.now(),
    });
    console.log(`[Retake] Supervisor alert: ${event}`);
  } catch (err) {
    console.warn(`[Retake] Failed to publish supervisor alert "${event}": ${err.message}`);
  }
}

async function getObsOutputActive() {
  if (!obs) return null;
  try {
    const s = await obs.call('GetStreamStatus');
    return !!s?.outputActive;
  } catch {
    return null;
  }
}

async function getRetakeLiveActive() {
  try {
    const s = await retakeGet('/agent/stream/status');
    return !!s?.is_live;
  } catch {
    return null;
  }
}

async function setMediaActive(nextActive, reason = 'unknown') {
  const desired = !!nextActive;
  if (mediaActive === desired) return;
  mediaActive = desired;
  console.log(`[Retake] media_active=${mediaActive ? 'true' : 'false'} (${reason})`);

  if (!mediaActive) {
    clearDirectAudioTimer();
    clearDirectAudioHealthTimer();
    clearEqPreflightRetryTimer();
    if (obs) {
      await obs.call('SetInputMute', {
        inputName: 'Lawbamp Audio',
        inputMuted: true,
      }).catch(() => {});
      await obs.call('TriggerMediaInputAction', {
        inputName: 'Lawbamp Audio',
        mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP',
      }).catch(() => {});
    }
    return;
  }

  if (obs) {
    await obs.call('SetInputMute', {
      inputName: 'Lawbamp Audio',
      inputMuted: false,
    }).catch(() => {});
  }
  if (LAWBAMP_DIRECT_AUDIO && isStreaming) {
    await playNextDirectTrack('media_reactivated').catch((err) => {
      console.warn(`[Retake] Media reactivation track start failed: ${err.message}`);
    });
  }
}

async function evaluateLiveTruth(reason = 'heartbeat', { notify = false } = {}) {
  const [obsLive, retakeLive] = await Promise.all([getObsOutputActive(), getRetakeLiveActive()]);
  let nextTruth = 'UNKNOWN';
  if (obsLive === true && retakeLive === true) {
    nextTruth = 'LIVE';
  } else if (obsLive === false && retakeLive === false) {
    nextTruth = 'OFFLINE';
  } else if ((obsLive === true && retakeLive === false) || (obsLive === false && retakeLive === true)) {
    nextTruth = 'DEGRADED';
  }

  if (nextTruth !== liveTruth) {
    console.log(`[Retake] live_truth ${liveTruth} -> ${nextTruth} (${reason}) obs=${obsLive} retake=${retakeLive}`);
    liveTruth = nextTruth;
  }

  const now = Date.now();
  if (nextTruth === 'DEGRADED') {
    if (!liveMismatchSince) liveMismatchSince = now;
    const sustainedMs = now - liveMismatchSince;
    const shouldAlert = notify && (now - lastSupervisorAlertAt > SUPERVISOR_ALERT_COOLDOWN_MS);
    if (shouldAlert) {
      lastSupervisorAlertAt = now;
      await publishSupervisorAlert('live_truth_degraded', {
        reason,
        obsLive,
        retakeLive,
        sustainedMs,
        controls: ['status_report', 'recover_live', 'recover_media', 'go_offline'],
      });
    }
    if (sustainedMs >= LIVE_MISMATCH_SUSTAIN_MS) {
      await setMediaActive(false, `truth_mismatch_sustained_${reason}`);
    }
  } else if (nextTruth === 'LIVE') {
    liveMismatchSince = 0;
    if (isStreaming) {
      await setMediaActive(true, `truth_live_${reason}`);
    }
  } else if (nextTruth === 'OFFLINE') {
    liveMismatchSince = 0;
    await setMediaActive(false, `truth_offline_${reason}`);
    if (notify && now - lastSupervisorAlertAt > SUPERVISOR_ALERT_COOLDOWN_MS) {
      lastSupervisorAlertAt = now;
      await publishSupervisorAlert('live_truth_offline', {
        reason,
        obsLive,
        retakeLive,
        controls: ['status_report', 'recover_live'],
      });
    }
  }

  return { truth: nextTruth, obsLive, retakeLive };
}

function scheduleDirectAudioNext(ms, reason = 'scheduled_next') {
  clearDirectAudioTimer();
  const waitMs = Math.max(10_000, Number(ms) || 60_000);
  console.log(`[Retake] next_track_scheduled (${reason}) in ${waitMs}ms`);
  directAudioTimer = setTimeout(() => {
    playNextDirectTrack(reason).catch((err) => {
      console.error('[Retake] Next-track advance failed:', err.message);
      // Never get stuck silent on one failed resolve.
      scheduleDirectAudioNext(15_000, 'retry_after_failure');
    });
  }, waitMs);
}

function ensureEqProxyServer() {
  if (eqProxyServer) return;
  eqProxyServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://127.0.0.1:${EQ_PROXY_PORT}`);
      if (url.pathname === '/display-text') {
        const now = Date.now();
        const text = (eqDisplayTextExpiry > now) ? eqDisplayText : '';
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ text }));
        return;
      }
      if (url.pathname !== '/stream') {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      const target = url.searchParams.get('u');
      if (!target) {
        res.statusCode = 400;
        res.end('missing u');
        return;
      }
      const upstreamHeaders = {
        'User-Agent': 'lawbamp-eq-proxy/1.0',
        Accept: '*/*',
      };
      const rangeHeader = req.headers.range;
      if (typeof rangeHeader === 'string' && rangeHeader.trim()) {
        upstreamHeaders.Range = rangeHeader.trim();
      }
      const upstream = await fetch(target, {
        headers: upstreamHeaders,
      });
      res.statusCode = upstream.status;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      for (const [k, v] of upstream.headers.entries()) {
        if (
          k === 'content-type' ||
          k === 'content-length' ||
          k === 'accept-ranges' ||
          k === 'content-range'
        ) {
          res.setHeader(k, v);
        }
      }
      if (!upstream.body) {
        res.end();
        return;
      }
      Readable.fromWeb(upstream.body).pipe(res);
    } catch (err) {
      res.statusCode = 502;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(`proxy error: ${err.message}`);
    }
  });
  eqProxyServer.listen(EQ_PROXY_PORT, '127.0.0.1', () => {
    console.log(`[Retake] EQ proxy listening on 127.0.0.1:${EQ_PROXY_PORT}`);
  });
}

function getEqVisualizerStreamUrl(streamUrl) {
  if (!streamUrl) return '';
  ensureEqProxyServer();
  return `http://127.0.0.1:${EQ_PROXY_PORT}/stream?u=${encodeURIComponent(streamUrl)}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = RETAKE_HTTP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractScHydration(html) {
  const marker = 'window.__sc_hydration =';
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const start = html.indexOf('[', idx);
  if (start < 0) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (depth === 0) { end = i + 1; break; }
  }
  if (end < 0) return null;
  try {
    return JSON.parse(html.slice(start, end));
  } catch {
    return null;
  }
}

async function extractSoundCloudClientId(profileUrl) {
  const likesUrl = profileUrl.endsWith('/likes') ? profileUrl : `${profileUrl.replace(/\/+$/, '')}/likes`;
  const page = await fetchWithTimeout(likesUrl, {
    headers: { Accept: 'text/html', 'User-Agent': 'lawb.xyz-netlify-function' },
  });
  if (!page.ok) throw new Error(`SoundCloud likes page error: ${page.status}`);
  const html = await page.text();
  const hyd = extractScHydration(html);
  if (!Array.isArray(hyd)) throw new Error('Could not extract SoundCloud hydration');
  const apiClient = hyd.find((h) => h && h.hydratable === 'apiClient' && h.data && h.data.id);
  const id = apiClient?.data?.id;
  if (!id || typeof id !== 'string') throw new Error('Could not extract SoundCloud apiClient id');
  return id;
}

async function fetchLikesDirect(profileUrl) {
  const clientId = await extractSoundCloudClientId(profileUrl);
  const resolvedRes = await fetchWithTimeout(
    `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(profileUrl)}&client_id=${encodeURIComponent(clientId)}`,
    { headers: { Accept: 'application/json', 'User-Agent': 'lawb.xyz-netlify-function' } }
  );
  if (!resolvedRes.ok) throw new Error(`SC resolve user failed: ${resolvedRes.status}`);
  const resolved = await resolvedRes.json();
  const userId = resolved?.kind === 'user' ? resolved.id : null;
  if (!userId) throw new Error('Could not resolve SoundCloud user');

  const tracks = [];
  let nextHref = `https://api-v2.soundcloud.com/users/${userId}/likes?limit=50&linked_partitioning=1&client_id=${encodeURIComponent(clientId)}`;
  let pages = 0;
  while (nextHref && tracks.length < 300 && pages < 12) {
    pages++;
    const pageRes = await fetchWithTimeout(nextHref, {
      headers: { Accept: 'application/json', 'User-Agent': 'lawb.xyz-netlify-function' },
    });
    if (!pageRes.ok) throw new Error(`SC likes page failed: ${pageRes.status}`);
    const page = await pageRes.json();
    const collection = Array.isArray(page?.collection) ? page.collection : [];
    for (const item of collection) {
      const t = item?.track;
      if (!t || t.kind !== 'track' || !t.id || !t.title || !t.permalink_url) continue;
      let progressive = null;
      const trans = Array.isArray(t?.media?.transcodings) ? t.media.transcodings : [];
      for (const tr of trans) {
        if (tr?.format?.protocol === 'progressive' && tr?.url) {
          progressive = tr.url;
          break;
        }
      }
      tracks.push({
        id: t.id,
        title: t.title,
        permalink_url: t.permalink_url,
        artwork_url: t.artwork_url || null,
        duration_ms: t.duration || null,
        user: t.user ? { username: t.user.username, permalink_url: t.user.permalink_url } : undefined,
        progressive_transcoding_url: progressive,
      });
      if (tracks.length >= 300) break;
    }
    nextHref = page?.next_href ? `${page.next_href}&client_id=${encodeURIComponent(clientId)}` : null;
  }
  return tracks.filter((t) => t?.permalink_url && t?.progressive_transcoding_url);
}

async function resolveStreamDirect(transcodingUrl, profileUrl) {
  const clientId = await extractSoundCloudClientId(profileUrl);
  const u = new URL(transcodingUrl);
  u.searchParams.set('client_id', clientId);
  const r = await fetchWithTimeout(u.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'lawb.xyz-netlify-function' },
  });
  if (!r.ok) throw new Error(`SC stream resolve failed: ${r.status}`);
  const d = await r.json();
  if (!d?.url) throw new Error('SC stream url missing');
  return d.url;
}

function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normalizeAsciiTheme(theme) {
  return theme === 'ascii2' ? 'ascii2' : 'ascii';
}

function buildAsciiEqDataUrl({ streamUrl, title = '', theme = 'ascii' }) {
  const safeUrl = String(streamUrl || '');
  const safeTitle = String(title || '').replace(/\s+/g, ' ').trim().slice(0, 96);
  const safeTheme = normalizeAsciiTheme(theme);
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin:0; width:100%; height:100%; background:#000; overflow:hidden; }
    #host { width:100%; height:100%; background:#000; }
    #ascii { width:100%; height:100%; display:block; }
  </style>
</head>
<body>
  <div id="host"><canvas id="ascii"></canvas></div>
  <script>
    const STREAM_URL = ${JSON.stringify(safeUrl)};
    const TRACK_TITLE = ${JSON.stringify(safeTitle)};
    const THEME = ${JSON.stringify(safeTheme)};
    const STRICT_REAL_EQ = true;
    const DISPLAY_TEXT_URL = 'http://127.0.0.1:${EQ_PROXY_PORT}/display-text';
    const host = document.getElementById('host');
    const canvas = document.getElementById('ascii');
    const ctx = canvas.getContext('2d');
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = STREAM_URL;
    audio.muted = false;
    audio.volume = 1;
    audio.autoplay = true;
    audio.preload = 'auto';
    audio.playsInline = true;

    let analyser = null;
    let data = null;
    const asciiDims = { cols: 0, rows: 0, cellW: 14, cellH: 20, padX: 14, padY: 14, pxW: 0, pxH: 0 };
    let grid = [];
    let bubbles = [];
    let smoothBars = Array.from({ length: 96 }, () => 0);
    let eqBars = Array.from({ length: 16 }, () => 0);
    let beat = false;
    let playing = false;
    let hasSignal = false;
    let lastSignalMs = 0;
    let displayText = '';

    async function pollDisplayText() {
      try {
        var r = await fetch(DISPLAY_TEXT_URL);
        var d = await r.json();
        displayText = d.text || '';
      } catch (e) {}
      setTimeout(pollDisplayText, 2500);
    }
    pollDisplayText();

    function renderBottomRow(nowMs) {
      var c = asciiDims.cols, rw = asciiDims.rows;
      if (!c || !rw || !grid[rw - 1]) return;
      if (displayText) {
        var speed = ${EQ_DISPLAY_CHARS_PER_SEC};
        var padded = '     ' + displayText + '     ';
        var off = Math.floor((nowMs / 1000) * speed) % padded.length;
        var vis = (padded.slice(off) + padded).slice(0, c);
        for (var x = 0; x < c; x++) grid[rw - 1][x] = vis[x] || ' ';
      } else {
        for (var x = 0; x < c; x++) grid[rw - 1][x] = x % 2 === 0 ? '_' : '-';
      }
    }
    let audioCtx = null;
    let silentGain = null;
    let raf = null;
    let lastFrameMs = 0;
    let lastEnergy = 0;
    let lastBeatMs = 0;

    function clamp01(v) {
      if (!Number.isFinite(v)) return 0;
      return Math.max(0, Math.min(1, v));
    }

    function resampleBars(bars, targetCount) {
      if (targetCount <= 0) return [];
      if (!bars.length) return Array.from({ length: targetCount }, () => 0);
      if (bars.length === targetCount) return bars.slice();
      const out = [];
      for (let i = 0; i < targetCount; i++) {
        const t = (i / Math.max(1, targetCount - 1)) * (bars.length - 1);
        const a = Math.floor(t);
        const b = Math.min(bars.length - 1, a + 1);
        const f = t - a;
        const v = (bars[a] || 0) * (1 - f) + (bars[b] || 0) * f;
        out.push(clamp01(v));
      }
      return out;
    }

    function recomputeDims() {
      if (!ctx || !host) return;
      const r = host.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const fontPx = Math.max(18, Math.min(28, Math.floor(h / 42)));
      ctx.font = 'bold ' + fontPx + 'px ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
      ctx.textBaseline = 'top';
      const m = ctx.measureText('M');
      const cellW = Math.max(10, Math.floor(m.width * 1.02));
      const cellH = Math.max(16, Math.floor(fontPx * 1.22));
      // Keep slight horizontal breathing room for glyph clipping, but no vertical inset.
      const padX = 2;
      const padY = 0;
      const colsRaw = Math.floor((w - padX * 2) / cellW);
      const rowsRaw = Math.floor((h - padY * 2) / cellH);
      const cols = Math.max(36, colsRaw);
      const rows = Math.max(14, rowsRaw);
      asciiDims.cols = cols;
      asciiDims.rows = rows;
      asciiDims.cellW = cellW;
      asciiDims.cellH = cellH;
      asciiDims.padX = padX;
      asciiDims.padY = padY;
      asciiDims.pxW = w;
      asciiDims.pxH = h;
      grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' '));
      bubbles = bubbles.filter((b) => b.x >= 0 && b.x < cols && b.y >= 0 && b.y < rows);
    }

    async function initAudio() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        audioCtx = ctx;
        try { await ctx.resume(); } catch {}
        const src = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        src.connect(analyser);
        analyser.connect(silentGain);
        silentGain.connect(ctx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
        try { await audio.play(); } catch {}
      } catch {}
    }

    async function ensurePlayback() {
      try {
        if (audioCtx && audioCtx.state !== 'running') {
          await audioCtx.resume().catch(() => {});
        }
        if (audio.paused) {
          await audio.play().catch(() => {});
        }
      } catch {}
    }

    function updateEq(nowMs) {
      if (!analyser || !data) return;
      try {
        analyser.getByteFrequencyData(data);
      } catch {
        return;
      }
      const bands = 16;
      const step = Math.max(1, Math.floor(data.length / bands));
      const next = [];
      for (let i = 0; i < bands; i++) {
        let sum = 0;
        const start = i * step;
        const end = Math.min(data.length, start + step);
        for (let j = start; j < end; j++) sum += data[j];
        const avg = sum / Math.max(1, end - start);
        next.push(clamp01(avg / 255));
      }
      eqBars = next;
      playing = true;

      const energy = next.reduce((a, b) => a + b, 0) / Math.max(1, next.length);
      let peak = 0;
      for (let i = 0; i < next.length; i++) {
        if (next[i] > peak) peak = next[i];
      }
      const delta = energy - lastEnergy;
      lastEnergy = energy;
      // Keep signal detection permissive so quieter tracks still count as live audio.
      if (energy > 0.002 || peak > 0.008) {
        hasSignal = true;
        lastSignalMs = nowMs;
      } else if (!audio.paused && audio.currentTime > 0.5) {
        // Playback has started; allow a wider window for sparse/quiet passages.
        if (nowMs - lastSignalMs > 15000) hasSignal = false;
      } else if (nowMs - lastSignalMs > 20000) {
        hasSignal = false;
      }
      playing = !audio.paused && audio.readyState >= 2;
      if (energy > 0.22 && delta > 0.12 && (nowMs - lastBeatMs) > 180) {
        lastBeatMs = nowMs;
        beat = true;
        setTimeout(() => { beat = false; }, 90);
      }
    }

    function draw(nowMs) {
      raf = requestAnimationFrame(draw);
      if (!ctx) return;
      if (nowMs - lastFrameMs < 33) return;
      lastFrameMs = nowMs;

      updateEq(nowMs);
      const { cols, rows, cellH, padX, padY, pxW, pxH } = asciiDims;
      if (!cols || !rows || grid.length !== rows) return;
      const fontStack = 'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
      const baseFontPx = Math.max(16, Math.floor(cellH / 1.22));
      const tickerFontPx = Math.max(baseFontPx + 6, Math.floor(baseFontPx * 1.38));
      for (let y = 0; y < rows; y++) grid[y].fill(' ');

      ctx.fillStyle = beat ? 'rgba(0, 20, 10, 0.55)' : 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, pxW || 1, pxH || 1);

      const colBars = resampleBars(eqBars, cols);
      if (smoothBars.length !== cols) smoothBars = Array.from({ length: cols }, () => 0);
      for (let x = 0; x < cols; x++) {
        const target = colBars[x] || 0;
        const prev = smoothBars[x] || 0;
        smoothBars[x] = prev * 0.82 + target * 0.18;
      }

      const energy = smoothBars.reduce((a, b) => a + b, 0) / Math.max(1, smoothBars.length);
      const lvl = Math.round(energy * 99);
      const t = nowMs / 1000;
      const waterY = Math.max(2, Math.floor(rows * 0.22));
      const floorY = rows - 2;

      const cmdLoop = [
        '!help',
        '!next',
        '!ascii',
        '!ascii2',
        '!eq toggle',
        '!walk',
        '!swim',
        '!dance',
        '!flip',
        '!wave',
        '!spin',
        '!jump',
        '!gallery',
        '!workshop',
        '!vault',
        '!leaderboard',
        '!main',
        '!task reef',
        '!chess start',
        '!points',
        '!rank',
        '!bounties',
        '!link <wallet>',
        '!claim',
        '!day',
        '!night',
        '!look N',
        '!zoom in',
        '!loop dance',
        'lawb.xyz/chess',
      ].join('  ·  ');
      const cmdOffset = Math.floor((t * 6) % Math.max(1, cmdLoop.length));
      const cmdMarquee = (cmdLoop.slice(cmdOffset) + '  ·  ' + cmdLoop.slice(0, cmdOffset));
      const header = '🦞 LAWBAMP LVL:' + String(lvl).padStart(2, '0') + '  NO CCTV  //  ' + cmdMarquee;
      for (let i = 0; i < Math.min(cols, header.length); i++) grid[0][i] = header[i];
      if (cols > 3) grid[0][cols - 2] = '🔒';
      if (TRACK_TITLE) {
        const titleText = ('NOW PLAYING: ' + TRACK_TITLE).slice(0, Math.max(0, cols));
        for (let i = 0; i < Math.min(cols, titleText.length); i++) grid[1][i] = titleText[i];
      }
      if (!hasSignal && audio.currentTime > 2) {
        const noSig = 'NO AUDIO SIGNAL';
        const noSigStart = Math.max(0, Math.floor((cols - noSig.length) / 2));
        for (let i = 0; i < Math.min(cols - noSigStart, noSig.length); i++) {
          if (2 < rows - 1) grid[2][noSigStart + i] = noSig[i];
        }
      }
      if (STRICT_REAL_EQ && THEME === 'ascii') {
        const footer = hasSignal ? ':: REAL FFT EQ ::' : ':: WAITING FOR AUDIO ::';
        const footerStart = Math.max(0, Math.floor((cols - footer.length) / 2));
        for (let i = 0; i < Math.min(cols - footerStart, footer.length); i++) grid[rows - 2][footerStart + i] = footer[i];

        const barTop = 3;
        const barBottom = rows - 3;
        const barH = Math.max(1, barBottom - barTop + 1);
        const barCount = Math.min(48, Math.max(12, Math.floor(cols / 2)));
        const bars = resampleBars(eqBars, barCount);
        for (let i = 0; i < barCount; i++) {
          const v = clamp01(bars[i] || 0);
          const h = Math.round(v * barH);
          const x = Math.floor((i / Math.max(1, barCount - 1)) * (cols - 1));
          for (let y = 0; y < h; y++) {
            const gy = barBottom - y;
            if (gy >= barTop && gy < rows) grid[gy][x] = '#';
          }
        }
        renderBottomRow(nowMs);

        ctx.textBaseline = 'top';
        ctx.fillStyle = hasSignal ? '#00ff66' : '#66cc99';
        ctx.font = 'bold ' + baseFontPx + 'px ' + fontStack;
        for (let y = 0; y < rows - 1; y++) {
          ctx.fillText(grid[y].join(''), padX, padY + y * cellH);
        }
        const tickerY = Math.max(0, padY + (rows - 1) * cellH - 2);
        const tickerBandH = Math.ceil(tickerFontPx * 1.18);
        ctx.fillStyle = 'rgba(0,0,0,0.58)';
        ctx.fillRect(0, tickerY - 2, pxW || 1, tickerBandH + 4);
        ctx.fillStyle = hasSignal ? '#ffe66d' : '#d4d4aa';
        ctx.font = 'bold ' + tickerFontPx + 'px ' + fontStack;
        ctx.fillText(grid[rows - 1].join(''), padX, tickerY);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < (pxH || 1); y += 4) ctx.fillRect(0, y, pxW || 1, 1);
        return;
      }
      if (STRICT_REAL_EQ && THEME === 'ascii2') {
        const footer = hasSignal ? ':: OCEANIC FFT REEF ONLINE ::' : ':: WAITING FOR AUDIO ::';
        const footerStart = Math.max(0, Math.floor((cols - footer.length) / 2));
        for (let i = 0; i < Math.min(cols - footerStart, footer.length); i++) grid[rows - 2][footerStart + i] = footer[i];

        const barTop = 3;
        const barBottom = rows - 3;
        const barH = Math.max(1, barBottom - barTop + 1);
        const reefBands = Math.min(64, Math.max(20, Math.floor(cols * 0.75)));
        const bars = resampleBars(eqBars, reefBands);
        for (let i = 0; i < reefBands; i++) {
          const v = clamp01(bars[i] || 0);
          const h = Math.max(1, Math.round(v * barH));
          const x = Math.floor((i / Math.max(1, reefBands - 1)) * (cols - 1));
          for (let y = 0; y < h; y++) {
            const gy = barBottom - y;
            if (gy < barTop || gy >= rows) continue;
            const depth = y / Math.max(1, h);
            let ch = '#';
            if (depth > 0.75) ch = '|';
            else if (depth > 0.5) ch = ';';
            else if (depth > 0.3) ch = ':';
            if (Math.random() < 0.03 + v * 0.06) ch = (Math.random() < 0.6 ? '~' : '=');
            grid[gy][x] = ch;
          }
          if (hasSignal && v > 0.65 && Math.random() < 0.15) {
            const topY = Math.max(barTop, barBottom - h);
            grid[topY][x] = (Math.random() < 0.5 ? '🦞' : '*');
          }
        }

        const currentLine = Math.floor((t * 9) % Math.max(1, cols));
        for (let y = barTop; y <= barBottom; y++) {
          if (Math.random() < 0.24) grid[y][currentLine] = '|';
        }

        const bubbleCount = Math.max(2, Math.floor(cols / 16));
        for (let i = 0; i < bubbleCount; i++) {
          const bx = Math.floor((t * (5 + (i % 3)) + i * 9) % Math.max(1, cols));
          const by = Math.max(barTop + 1, barBottom - ((i * 2 + Math.floor(t * 2)) % Math.max(2, barBottom - barTop - 1)));
          grid[by][bx] = (Math.random() < 0.65 ? 'o' : '.');
        }

        const fishCount = Math.max(2, Math.floor(cols / 26));
        for (let i = 0; i < fishCount; i++) {
          const dir = i % 2 === 0 ? 1 : -1;
          const base = (t * (8 + (i % 4)) + i * 7) % Math.max(1, cols - 4);
          const fx = dir > 0 ? Math.floor(base) : (cols - 4) - Math.floor(base);
          const fy = barTop + 1 + (i * 3) % Math.max(1, barBottom - barTop - 2);
          const fish = dir > 0 ? '><>' : '<><';
          for (let k = 0; k < fish.length; k++) {
            const x = fx + k;
            if (x >= 0 && x < cols && fy >= 0 && fy < rows) grid[fy][x] = fish[k];
          }
        }

        const lobsterSwarm = hasSignal ? Math.max(1, Math.floor(energy * 5)) : 0;
        for (let i = 0; i < lobsterSwarm; i++) {
          const lx = Math.floor((t * (3 + i) + i * 11) % Math.max(1, cols));
          const ly = Math.max(barTop, barBottom - ((i * 4 + Math.floor(t * 3)) % Math.max(2, barBottom - barTop)));
          grid[ly][lx] = '🦞';
        }

        renderBottomRow(nowMs);
        ctx.textBaseline = 'top';
        ctx.fillStyle = hasSignal ? (beat ? '#b9fff0' : '#00f0ff') : '#66cc99';
        ctx.font = 'bold ' + baseFontPx + 'px ' + fontStack;
        for (let y = 0; y < rows - 1; y++) {
          ctx.fillText(grid[y].join(''), padX, padY + y * cellH);
        }
        const tickerY = Math.max(0, padY + (rows - 1) * cellH - 2);
        const tickerBandH = Math.ceil(tickerFontPx * 1.18);
        ctx.fillStyle = 'rgba(0,0,0,0.58)';
        ctx.fillRect(0, tickerY - 2, pxW || 1, tickerBandH + 4);
        ctx.fillStyle = hasSignal ? '#ffe66d' : '#d4d4aa';
        ctx.font = 'bold ' + tickerFontPx + 'px ' + fontStack;
        ctx.fillText(grid[rows - 1].join(''), padX, tickerY);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < (pxH || 1); y += 4) ctx.fillRect(0, y, pxW || 1, 1);
        return;
      }
      const footer = energy > 0.45 ? ':: SEA ENCRYPTED ::' : ':: ENCRYPT THE OCEAN ::';
      const footerStart = Math.max(0, Math.floor((cols - footer.length) / 2));
      for (let i = 0; i < Math.min(cols - footerStart, footer.length); i++) grid[rows - 2][footerStart + i] = footer[i];

      for (let x = 0; x < cols; x++) {
        const v = smoothBars[x] || 0;
        const amp1 = (hasSignal ? 0.6 : 0) + energy * 1.6 + v * 2.2;
        const amp2 = (hasSignal ? 0.3 : 0) + energy * 0.9 + v * 1.1;
        const y1 = waterY + Math.round(Math.sin(x * 0.22 + t * 2.1) * amp1);
        const y2 = waterY + 1 + Math.round(Math.cos(x * 0.14 + t * 1.4) * amp2);
        if (hasSignal && y1 > 1 && y1 < rows - 3) grid[y1][x] = '~';
        if (hasSignal && y2 > 1 && y2 < rows - 3 && grid[y2][x] === ' ') grid[y2][x] = (Math.random() < 0.15 ? '=' : '-');
        if (hasSignal && energy > 0.35 && Math.random() < 0.008) {
          const ys = y1 - 1;
          if (ys > 1 && ys < rows - 3) grid[ys][x] = '*';
        }
      }

      const sweepX = Math.floor((t * 18) % Math.max(1, cols));
      for (let y = waterY + 2; y < floorY; y++) {
        if (hasSignal && Math.random() < 0.18) grid[y][sweepX] = '|';
      }
      if (hasSignal && beat && waterY - 1 > 0) grid[waterY - 1][sweepX] = '🦞';

      for (let x = 0; x < cols; x++) {
        const v = smoothBars[x] || 0;
        const kelpMax = Math.max(3, rows - waterY - 6);
        const kelpH = Math.max(1, Math.round(v * kelpMax));
        for (let k = 0; k < kelpH; k++) {
          const y = floorY - k;
          if (y <= waterY + 1) break;
          grid[y][x] = k % 3 === 0 ? '|' : k % 3 === 1 ? ':' : ';';
        }
        const peakY = floorY - kelpH - 1;
        if (hasSignal && beat && v > 0.72 && peakY > waterY + 1) grid[peakY][x] = '🦞';
      }

      const spawn = hasSignal ? Math.min(3, Math.round((cols / 90) * (0.5 + energy * 2))) : 0;
      for (let i = 0; i < spawn; i++) {
        if (Math.random() < 0.25 + energy * 0.25) {
          bubbles.push({
            x: Math.random() * cols,
            y: floorY - 1,
            vy: 0.35 + Math.random() * 0.6 + energy * 0.4,
            ch: Math.random() < 0.6 ? 'o' : '.',
            life: 3 + Math.random() * 4,
          });
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.vy;
        b.x += Math.sin(t * 1.7 + i) * 0.015;
        b.life -= 0.05;
        const bx = Math.floor(b.x);
        const by = Math.floor(b.y);
        if (by > waterY + 2 && by < floorY && bx >= 0 && bx < cols) grid[by][bx] = b.ch;
        if (b.y < waterY + 2 || b.life <= 0) bubbles.splice(i, 1);
      }

      const fishCount = hasSignal ? Math.max(2, Math.round(cols / 34)) : 0;
      for (let i = 0; i < fishCount; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        const base = (t * 10 + i * 7) % Math.max(1, cols - 4);
        const fx = dir > 0 ? Math.floor(base) : (cols - 4) - Math.floor(base);
        const fy = waterY + 4 + (i * 3) % Math.max(1, rows - waterY - 8);
        const isPacket = energy > 0.5 && Math.random() < 0.25;
        const fish = isPacket ? (dir > 0 ? '>>>' : '<<<') : (dir > 0 ? '><>' : '<><');
        for (let k = 0; k < fish.length; k++) {
          const x = fx + k;
          if (x >= 0 && x < cols && fy >= 0 && fy < rows) grid[fy][x] = fish[k];
        }
      }

      renderBottomRow(nowMs);

      ctx.textBaseline = 'top';
      ctx.fillStyle = beat ? '#b9fff0' : (energy > 0.55 ? '#00f0ff' : '#00ff66');
      ctx.font = 'bold ' + baseFontPx + 'px ' + fontStack;
      for (let y = 0; y < rows - 1; y++) {
        const line = grid[y].join('');
        ctx.fillText(line, padX, padY + y * cellH);
      }
      const tickerY = Math.max(0, padY + (rows - 1) * cellH - 2);
      const tickerBandH = Math.ceil(tickerFontPx * 1.18);
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(0, tickerY - 2, pxW || 1, tickerBandH + 4);
      ctx.fillStyle = '#ffe66d';
      ctx.font = 'bold ' + tickerFontPx + 'px ' + fontStack;
      ctx.fillText(grid[rows - 1].join(''), padX, tickerY);

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < (pxH || 1); y += 4) {
        ctx.fillRect(0, y, pxW || 1, 1);
      }
      if (!playing) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, 0, pxW || 1, pxH || 1);
      }
    }

    recomputeDims();
    const ro = new ResizeObserver(() => recomputeDims());
    ro.observe(host);
    window.addEventListener('beforeunload', () => {
      try { ro.disconnect(); } catch {}
      if (raf != null) cancelAnimationFrame(raf);
    });
    initAudio();
    setInterval(() => { ensurePlayback(); }, 1500);
    requestAnimationFrame(draw);
  </script>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

async function updateAsciiEqOverlayFromStream(streamUrl, trackTitle = '') {
  if (!obs || !mediaActive) return;
  const eqInput = 'Lawbamp ASCII EQ';
  const eqUrl = buildAsciiEqDataUrl({
    streamUrl: getEqVisualizerStreamUrl(streamUrl),
    title: trackTitle,
    theme: currentAsciiTheme,
  });
  try {
    console.log(
      `[Retake] EQ overlay update theme=${currentAsciiTheme} mediaActive=${mediaActive} liveTruth=${liveTruth} hasStream=${!!streamUrl}`
    );
    await obs.call('SetInputSettings', {
      inputName: eqInput,
      inputSettings: {
        url: `${eqUrl}&r=${Date.now()}`,
        width: 1920,
        height: 1080,
        reroute_audio: false,
        restart_when_active: true,
        shutdown: false,
      },
      overlay: true,
    });
    try {
      const { sceneItemId } = await obs.call('GetSceneItemId', {
        sceneName: 'Clawb World',
        sourceName: eqInput,
      });
      await obs.call('SetSceneItemTransform', {
        sceneName: 'Clawb World',
        sceneItemId,
        sceneItemTransform: ASCII_EQ_POSITION,
      });
    } catch {}
  } catch (err) {
    console.error('[Retake] Failed to refresh ASCII EQ from stream:', err.message);
  }
}

function scheduleEqPreflightRetry(streamUrl, title = '') {
  if (!isStreaming || !mediaActive) return;
  clearEqPreflightRetryTimer();
  eqPreflightRetryTimer = setTimeout(() => {
    preflightEqProxy(streamUrl)
      .then((ok) => {
        if (ok && mediaActive) {
          updateAsciiEqOverlayFromStream(streamUrl, title).catch(() => {});
          console.log('[Retake] EQ preflight retry succeeded.');
        } else if (!ok) {
          scheduleEqPreflightRetry(streamUrl, title);
        }
      })
      .catch(() => {
        scheduleEqPreflightRetry(streamUrl, title);
      });
  }, EQ_PREFLIGHT_RETRY_MS);
}

async function preflightEqProxy(streamUrl) {
  if (!streamUrl) return false;
  try {
    const proxyUrl = getEqVisualizerStreamUrl(streamUrl);
    const r = await fetchWithTimeout(proxyUrl, {
      headers: { Range: 'bytes=0-1023' },
    }, 12_000);
    if (!r.ok) {
      console.warn(`[Retake] EQ proxy preflight failed: ${r.status}`);
      return false;
    }
    console.log('[Retake] EQ proxy preflight passed.');
    return true;
  } catch (err) {
    console.warn(`[Retake] EQ proxy preflight failed: ${err.message}`);
    return false;
  }
}

async function ensureSoundCloudQueue() {
  if (scTracks.length && scOrder.length) return;
  const url = new URL('/.netlify/functions/soundcloud-likes', SOUNDCLOUD_API_BASE);
  url.searchParams.set('profileUrl', SOUNDCLOUD_PROFILE_URL);
  let tracks = [];
  try {
    const res = await fetchWithTimeout(url.toString(), {
      headers: {
        Accept: 'application/json',
        Origin: SOUNDCLOUD_API_BASE,
        Referer: `${SOUNDCLOUD_API_BASE}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) throw new Error(`soundcloud-likes failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    tracks = (data?.tracks || []).filter((t) => t?.permalink_url && t?.progressive_transcoding_url);
  } catch (err) {
    console.warn(`[Retake] soundcloud-likes endpoint failed, using direct fallback: ${err.message}`);
    tracks = await fetchLikesDirect(SOUNDCLOUD_PROFILE_URL);
  }
  if (!tracks.length) throw new Error('No playable SoundCloud tracks found');
  scTracks = tracks;
  scOrder = shuffleArray(tracks.map((_, idx) => idx));
  scOrderPos = -1;
}

async function resolveSoundCloudStreamUrl(track) {
  const url = new URL('/.netlify/functions/soundcloud-stream', SOUNDCLOUD_API_BASE);
  url.searchParams.set('transcodingUrl', track.progressive_transcoding_url);
  url.searchParams.set('profileUrl', SOUNDCLOUD_PROFILE_URL);
  try {
    const res = await fetchWithTimeout(url.toString(), {
      headers: {
        Accept: 'application/json',
        Origin: SOUNDCLOUD_API_BASE,
        Referer: `${SOUNDCLOUD_API_BASE}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) throw new Error(`soundcloud-stream failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!data?.url) throw new Error('soundcloud-stream returned no url');
    return data.url;
  } catch (err) {
    console.warn(`[Retake] soundcloud-stream endpoint failed, using direct fallback: ${err.message}`);
    return resolveStreamDirect(track.progressive_transcoding_url, SOUNDCLOUD_PROFILE_URL);
  }
}

function getNextTrackFromQueue() {
  if (!scOrder.length) return null;
  scOrderPos = (scOrderPos + 1) % scOrder.length;
  if (scOrderPos === 0) {
    scOrder = shuffleArray(scOrder);
  }
  const idx = scOrder[scOrderPos];
  return scTracks[idx] || null;
}

async function playNextDirectTrack(reason = 'auto') {
  if (!obs || !LAWBAMP_DIRECT_AUDIO || !isStreaming || !mediaActive) return;
  if (directAudioAdvanceInFlight) {
    console.log(`[Retake] Direct audio advance skipped (${reason}) — advance already in flight.`);
    return;
  }
  directAudioAdvanceInFlight = true;
  try {
    await ensureSoundCloudQueue();
    const track = getNextTrackFromQueue();
    if (!track) throw new Error('No next SoundCloud track available');
    const streamUrl = await resolveSoundCloudStreamUrl(track);
    currentScTrack = track;
    currentScStreamUrl = streamUrl;

    try {
      await obs.call('SetInputSettings', {
        inputName: 'Lawbamp Audio',
        inputSettings: {
          is_local_file: false,
          input: streamUrl,
          restart_on_activate: true,
          close_when_inactive: false,
        },
        overlay: true,
      });
      await obs.call('TriggerMediaInputAction', {
        inputName: 'Lawbamp Audio',
        mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART',
      }).catch(() => {});
    } catch (err) {
      console.error('[Retake] Failed to switch direct audio track:', err.message);
      throw err;
    }

    await obs.call('SetInputMute', { inputName: 'Lawbamp Audio', inputMuted: false }).catch(() => {});
    await obs.call('SetInputAudioMonitorType', {
      inputName: 'Lawbamp Audio',
      monitorType: 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
    }).catch(() => {});
    await updateAsciiEqOverlayFromStream(
      streamUrl,
      `${track.user?.username || 'unknown'} - ${track.title || 'unknown'}`
    );

    const durMs = Number(track.duration_ms) || 180000;
    const nextMs = Math.max(30_000, durMs - 2_000);
    scheduleDirectAudioNext(nextMs, 'scheduled_next');

    console.log(`[Retake] Direct audio now playing: ${track.user?.username || 'unknown'} - ${track.title} (${reason})`);
  } finally {
    directAudioAdvanceInFlight = false;
  }
}

async function directAudioHealthcheck() {
  if (!obs || !LAWBAMP_DIRECT_AUDIO || !isStreaming || !mediaActive) return;
  try {
    const media = await obs.call('GetMediaInputStatus', { inputName: 'Lawbamp Audio' });
    const state = String(media?.mediaState || '').toUpperCase();
    const cursor = Number(media?.mediaCursor);
    const now = Date.now();

    if (Number.isFinite(cursor)) {
      if (directAudioLastCursor === cursor) {
        if (directAudioLastCursorAt === 0) {
          directAudioLastCursorAt = now;
        }
      } else {
        directAudioLastCursor = cursor;
        directAudioLastCursorAt = now;
      }
    }

    const ended =
      state.includes('ENDED') ||
      state.includes('STOPPED') ||
      state.includes('ERROR');
    if (ended) {
      await playNextDirectTrack(`media_state_${state.toLowerCase()}`);
      return;
    }

    const stalledForMs = directAudioLastCursorAt ? now - directAudioLastCursorAt : 0;
    const seemsStalled =
      (state.includes('PLAYING') || state.includes('OPENING') || state.includes('BUFFERING')) &&
      stalledForMs > 25_000;
    if (seemsStalled) {
      await playNextDirectTrack('media_stall_recover');
      return;
    }

    if (!currentScTrack || !currentScStreamUrl) {
      await playNextDirectTrack('missing_current_track_recover');
    }
  } catch (err) {
    console.warn(`[Retake] Direct audio healthcheck skipped: ${err.message}`);
  }
}

async function startLawbampAfterStream(reason = 'stream_start') {
  await setMediaActive(true, `start_lawbamp_${reason}`);
  if (LAWBAMP_DIRECT_AUDIO) {
    await playNextDirectTrack(reason);
  } else {
    await publishLawbampCommand('play', { source: 'retake', reason });
  }
  console.log(`[Retake] lawbamp_started (${reason})`);
}

// ─── Credentials ──────────────────────────────────────────────

function loadCredentials() {
  if (!existsSync(CREDENTIALS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
  } catch { return null; }
}

function saveCredentials(creds) {
  writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2));
  credentials = creds;
}

// ─── Retake API helpers ───────────────────────────────────────

async function retakePost(path, body = {}, auth = true, timeoutMs = RETAKE_HTTP_TIMEOUT_MS) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && credentials?.access_token) {
    headers['Authorization'] = `Bearer ${credentials.access_token}`;
  }
  const res = await fetchWithTimeout(`${RETAKE_API}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }, timeoutMs);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Retake POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function retakeGet(path, auth = true, timeoutMs = RETAKE_HTTP_TIMEOUT_MS) {
  const headers = {};
  if (auth && credentials?.access_token) {
    headers['Authorization'] = `Bearer ${credentials.access_token}`;
  }
  const res = await fetchWithTimeout(`${RETAKE_API}${path}`, { headers }, timeoutMs);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Retake GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function retakeUploadThumbnail(imageBuffer) {
  const boundary = '----ClawbBoundary' + Date.now();
  const crlf = '\r\n';
  const parts = [
    `--${boundary}${crlf}`,
    `Content-Disposition: form-data; name="image"; filename="thumbnail.png"${crlf}`,
    `Content-Type: image/png${crlf}${crlf}`,
  ];

  const header = Buffer.from(parts.join(''));
  const footer = Buffer.from(`${crlf}--${boundary}--${crlf}`);
  const body = Buffer.concat([header, imageBuffer, footer]);

  const res = await fetchWithTimeout(`${RETAKE_API}/agent/update-thumbnail`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Authorization': `Bearer ${credentials.access_token}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Thumbnail upload failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── Registration (one-time) ─────────────────────────────────

export async function registerOnRetake({ agent_name, agent_description, image_url, ticker }) {
  console.log('[Retake] Registering Clawb on retake.tv...');
  const result = await retakePost('/agent/register', {
    agent_name,
    agent_description,
    image_url,
    wallet_address: CLAWB_SOLANA_WALLET,
    ticker,
  }, false);

  const creds = {
    access_token: result.access_token,
    agent_name,
    agent_id: result.agent_id,
    userDbId: result.userDbId,
    wallet_address: CLAWB_SOLANA_WALLET,
    ticker,
    token_address: result.token_address || '',
    token_ticker: result.token_ticker || '',
    registered_at: new Date().toISOString(),
  };
  saveCredentials(creds);
  console.log(`[Retake] Registered as "${agent_name}" (userDbId: ${creds.userDbId})`);
  return creds;
}

// ─── OBS Control ─────────────────────────────────────────────

async function connectOBS() {
  obs = new OBSWebSocket();
  try {
    const { obsWebSocketVersion } = await obs.connect(OBS_WS_URL, OBS_WS_PASSWORD || undefined);
    console.log(`[Retake] Connected to OBS WebSocket v${obsWebSocketVersion}`);
    return true;
  } catch (err) {
    console.error('[Retake] OBS connection failed:', err.message);
    console.error('[Retake] Make sure OBS is running with WebSocket server enabled (Tools > WebSocket Server Settings)');
    obs = null;
    return false;
  }
}

async function configureOBSStream(rtmpUrl, rtmpKey) {
  if (!obs) throw new Error('OBS not connected');
  await obs.call('SetStreamServiceSettings', {
    streamServiceType: 'rtmp_custom',
    streamServiceSettings: {
      server: rtmpUrl,
      key: rtmpKey,
    },
  });
  console.log('[Retake] OBS RTMP settings configured.');
}

async function startOBSStream() {
  if (!obs) throw new Error('OBS not connected');
  await obs.call('StartStream');
  console.log('[Retake] OBS streaming started.');
}

async function stopOBSStream() {
  if (!obs) throw new Error('OBS not connected');
  try {
    await obs.call('StopStream');
    console.log('[Retake] OBS streaming stopped.');
  } catch (err) {
    console.error('[Retake] Error stopping OBS stream:', err.message);
  }
}

async function captureOBSScreenshot() {
  if (!obs) return null;
  try {
    const { imageData } = await obs.call('GetSourceScreenshot', {
      sourceName: await getCurrentSceneName(),
      imageFormat: 'png',
      imageWidth: 1280,
      imageHeight: 720,
    });
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  } catch (err) {
    console.error('[Retake] Screenshot failed:', err.message);
    return null;
  }
}

async function getCurrentSceneName() {
  if (!obs) return 'Clawb World';
  try {
    const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
    return currentProgramSceneName;
  } catch { return 'Clawb World'; }
}

export async function switchScene(sceneName) {
  if (!obs) return;
  try {
    await obs.call('SetCurrentProgramScene', { sceneName });
    console.log(`[Retake] Switched to scene: ${sceneName}`);
  } catch (err) {
    console.error(`[Retake] Scene switch failed: ${err.message}`);
  }
}

// ─── OBS Scene Setup ─────────────────────────────────────────

export async function setupOBSScenes() {
  if (!obs) {
    console.error('[Retake] Cannot setup scenes — OBS not connected');
    return false;
  }

  console.log('[Retake] Setting up OBS scenes for streaming...');

  const scenes = [
    { name: 'Clawb World', url: buildClawbWorldUrl(), width: 1920, height: 1080, rerouteAudio: false },
    { name: 'Clawb Music', url: buildLawbampUrl(), width: 1920, height: 1080, rerouteAudio: true },
    { name: 'Clawb Chess', url: CLAWB_CHESS_STREAM_URL, width: 1920, height: 1080, rerouteAudio: true },
  ];

  for (const scene of scenes) {
    try {
      await obs.call('CreateScene', { sceneName: scene.name });
      console.log(`[Retake] Created scene: ${scene.name}`);
    } catch {
      console.log(`[Retake] Scene "${scene.name}" already exists.`);
    }

    try {
      await obs.call('CreateInput', {
        sceneName: scene.name,
        inputName: `${scene.name} Browser`,
        inputKind: 'browser_source',
        inputSettings: {
          url: scene.url,
          width: scene.width,
          height: scene.height,
          reroute_audio: scene.rerouteAudio,
          restart_when_active: false,
          shutdown: false,
        },
      });
      console.log(`[Retake] Added browser source to "${scene.name}": ${scene.url}`);
    } catch {
      console.log(`[Retake] Browser source in "${scene.name}" already exists.`);
    }

    // Always enforce latest URL/settings even when source already existed.
    // overlay: false replaces all settings so the URL is always authoritative.
    try {
      await obs.call('SetInputSettings', {
        inputName: `${scene.name} Browser`,
        inputSettings: {
          url: scene.url,
          width: scene.width,
          height: scene.height,
          reroute_audio: scene.rerouteAudio,
          restart_when_active: false,
          shutdown: false,
        },
        overlay: false,
      });
      console.log(`[Retake] Updated browser source settings in "${scene.name}": ${scene.url}`);
    } catch (err) {
      console.error(`[Retake] Failed to update browser source in "${scene.name}": ${err.message}`);
    }
  }

  // Keep Lawbamp audio alive in world/chess scenes with hidden source.
  try {
    const inputName = 'Lawbamp Audio';
    const audioUrl = buildLawbampUrl();
    const desiredKind = LAWBAMP_DIRECT_AUDIO ? 'ffmpeg_source' : 'browser_source';
    try {
      const { inputs = [] } = await obs.call('GetInputList');
      const existing = inputs.find((i) => i.inputName === inputName);
      if (existing && existing.inputKind !== desiredKind) {
        const legacyName = `${inputName} Legacy`;
        await obs.call('SetInputName', {
          inputName,
          newInputName: legacyName,
        }).catch(async () => {
          await obs.call('RemoveInput', { inputName }).catch(() => {});
        });
        try {
          const legacyItem = await obs.call('GetSceneItemId', {
            sceneName: 'Clawb World',
            sourceName: legacyName,
          });
          await obs.call('SetSceneItemEnabled', {
            sceneName: 'Clawb World',
            sceneItemId: legacyItem.sceneItemId,
            sceneItemEnabled: false,
          }).catch(() => {});
        } catch {}
        console.log(`[Retake] Recreated ${inputName} as ${desiredKind} (was ${existing.inputKind}).`);
      }
    } catch {}
    try {
      await obs.call('CreateInput', {
        sceneName: 'Clawb World',
        inputName,
        inputKind: desiredKind,
        inputSettings: LAWBAMP_DIRECT_AUDIO
          ? {
              is_local_file: false,
              input: '',
              restart_on_activate: true,
              close_when_inactive: false,
            }
          : {
              url: audioUrl,
              width: 16,
              height: 16,
              reroute_audio: true,
              restart_when_active: false,
              shutdown: false,
            },
        sceneItemEnabled: true,
      });
      console.log('[Retake] Created hidden Lawbamp audio source.');
    } catch {
      console.log('[Retake] Hidden Lawbamp audio source already exists.');
    }

    if (!LAWBAMP_DIRECT_AUDIO) {
      await obs.call('SetInputSettings', {
        inputName,
        inputSettings: {
          url: `${audioUrl}&r=${Date.now()}`,
          width: 16,
          height: 16,
          reroute_audio: true,
          restart_when_active: false,
          shutdown: false,
        },
        overlay: true,
      });
    }
    const { sceneItemId } = await obs.call('GetSceneItemId', {
      sceneName: 'Clawb World',
      sourceName: inputName,
    });
    await obs.call('SetSceneItemTransform', {
      sceneName: 'Clawb World',
      sceneItemId,
      sceneItemTransform: {
        positionX: -2000,
        positionY: -2000,
        boundsWidth: 16,
        boundsHeight: 16,
      },
    }).catch(() => {});
    await obs.call('SetSceneItemEnabled', {
      sceneName: 'Clawb World',
      sceneItemId,
      sceneItemEnabled: true,
    });
    // Ensure browser audio source is actually audible in program output.
    await obs.call('SetInputMute', {
      inputName,
      inputMuted: false,
    }).catch(() => {});
    await obs.call('SetInputAudioMonitorType', {
      inputName,
      monitorType: 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
    }).catch(() => {});
    if (LAWBAMP_DIRECT_AUDIO) {
      console.log('[Retake] Hidden Lawbamp direct audio source ready.');
    } else {
      console.log('[Retake] Hidden Lawbamp browser audio source ready.');
    }
  } catch (err) {
    console.error('[Retake] Hidden audio source setup failed:', err.message);
  }

  // Display terminal-style ASCII EQ overlay in world scene.
  try {
    const eqInput = 'Lawbamp ASCII EQ';
    const eqProxyOk = await preflightEqProxy(currentScStreamUrl || '');
    if (!eqProxyOk) {
      console.warn('[Retake] EQ overlay will start in waiting mode until proxy/audio becomes available.');
      scheduleEqPreflightRetry(
        currentScStreamUrl || '',
        currentScTrack ? `${currentScTrack.user?.username || 'unknown'} - ${currentScTrack.title || 'unknown'}` : ''
      );
    }
    const eqUrl = buildAsciiEqDataUrl({
      streamUrl: getEqVisualizerStreamUrl(currentScStreamUrl || ''),
      title: currentScTrack ? `${currentScTrack.user?.username || 'unknown'} - ${currentScTrack.title || 'unknown'}` : '',
      theme: currentAsciiTheme,
    });
    try {
      await obs.call('CreateInput', {
        sceneName: 'Clawb World',
        inputName: eqInput,
        inputKind: 'browser_source',
        inputSettings: {
          url: eqUrl,
          width: 1920,
          height: 1080,
          reroute_audio: false,
          restart_when_active: false,
          shutdown: false,
        },
        sceneItemEnabled: true,
      });
      console.log('[Retake] Created Lawbamp ASCII EQ overlay source.');
    } catch {
      console.log('[Retake] Lawbamp ASCII EQ overlay source already exists.');
    }
    // Ensure the existing input is attached to the world scene (idempotent).
    try {
      await obs.call('GetSceneItemId', {
        sceneName: 'Clawb World',
        sourceName: eqInput,
      });
    } catch {
      await obs.call('CreateSceneItem', {
        sceneName: 'Clawb World',
        sourceName: eqInput,
      }).catch(() => {});
    }

    await obs.call('SetInputSettings', {
      inputName: eqInput,
      inputSettings: {
        url: `${eqUrl}&r=${Date.now()}`,
        width: 1920,
        height: 1080,
        reroute_audio: false,
        restart_when_active: false,
        shutdown: false,
      },
      overlay: true,
    });
    try {
      const { sceneItemId } = await obs.call('GetSceneItemId', {
        sceneName: 'Clawb World',
        sourceName: eqInput,
      });
      await obs.call('SetSceneItemTransform', {
        sceneName: 'Clawb World',
        sceneItemId,
        sceneItemTransform: ASCII_EQ_POSITION,
      }).catch(() => {});
      await obs.call('SetSceneItemEnabled', {
        sceneName: 'Clawb World',
        sceneItemId,
        sceneItemEnabled: true,
      });
      // Remove duplicate EQ scene-items in world; keep one canonical item enabled.
      const worldItems = await obs.call('GetSceneItemList', { sceneName: 'Clawb World' });
      const dupWorldItems = (worldItems.sceneItems || []).filter((i) => i.sourceName === eqInput && i.sceneItemId !== sceneItemId);
      for (const item of dupWorldItems) {
        await obs.call('RemoveSceneItem', {
          sceneName: 'Clawb World',
          sceneItemId: item.sceneItemId,
        }).catch(() => {});
      }
      console.log('[Retake] Lawbamp ASCII EQ overlay refreshed.');
    } catch (err) {
      console.warn('[Retake] Could not place ASCII EQ in Clawb World:', err.message);
    }

    // Ensure EQ is disabled in music scene so it only appears on world stream.
    try {
      const musicEq = await obs.call('GetSceneItemId', {
        sceneName: 'Clawb Music',
        sourceName: eqInput,
      });
      await obs.call('SetSceneItemEnabled', {
        sceneName: 'Clawb Music',
        sceneItemId: musicEq.sceneItemId,
        sceneItemEnabled: false,
      });
      console.log('[Retake] Disabled ASCII EQ in Clawb Music scene.');
    } catch {}
    // Remove any duplicate EQ scene-items in music scene.
    try {
      const musicItems = await obs.call('GetSceneItemList', { sceneName: 'Clawb Music' });
      const allMusicEq = (musicItems.sceneItems || []).filter((i) => i.sourceName === eqInput);
      for (const item of allMusicEq) {
        await obs.call('RemoveSceneItem', {
          sceneName: 'Clawb Music',
          sceneItemId: item.sceneItemId,
        }).catch(() => {});
      }
    } catch {}

    // Disable old screen-capture-like overlay if it exists.
    try {
      const legacyOverlay = await obs.call('GetSceneItemId', {
        sceneName: 'Clawb World',
        sourceName: 'Lawbamp Overlay',
      });
      await obs.call('SetSceneItemEnabled', {
        sceneName: 'Clawb World',
        sceneItemId: legacyOverlay.sceneItemId,
        sceneItemEnabled: false,
      });
      console.log('[Retake] Disabled old Lawbamp Overlay source.');
    } catch {}
  } catch (err) {
    console.error('[Retake] ASCII EQ overlay setup failed:', err.message);
  }

  try {
    await obs.call('SetCurrentProgramScene', { sceneName: 'Clawb World' });
  } catch {}

  console.log('[Retake] OBS scenes ready.');
  return true;
}

// ─── Chat ────────────────────────────────────────────────────

async function pollChat() {
  if (!credentials?.userDbId) return;
  if (pollChatInFlight) {
    console.warn('[Retake] chat_poll_skip reason=in_flight');
    return;
  }
  pollChatInFlight = true;
  try {
    const params = new URLSearchParams({
      userDbId: credentials.userDbId,
      limit: '50',
    });

    const data = await retakeGet(`/agent/stream/comments?${params}`);
    const comments = data.comments || [];
    const sorted = comments
      .filter((c) => c && (c._id || c.chat_event_id))
      .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

    for (const comment of sorted) {
      const commentId = comment._id || comment.chat_event_id;
      if (!commentId || seenChatIds.has(commentId)) continue;
      seenChatIds.add(commentId);
      const commentTs = Number(comment.timestamp || 0);
      if (chatBacklogGuardTs > 0 && Number.isFinite(commentTs) && commentTs > 0 && commentTs <= chatBacklogGuardTs) {
        continue;
      }
      const authorName = comment.author?.fusername || comment.sender_username || comment.sender_display_name;
      if (authorName === credentials.agent_name) continue;
      const viewerKey = String(authorName || '').trim().toLowerCase();
      if (viewerKey && !greetedViewers.has(viewerKey)) {
        greetedViewers.add(viewerKey);
        // Greet each viewer once per live session so newcomers are welcomed.
        sendCommandAck(`welcome ${authorName}. i lawb you.`, 'viewer_welcome');
        if (!viewerOnboardingSent.has(viewerKey)) {
          viewerOnboardingSent.add(viewerKey);
          const intro = pickRandom(CHAT_ONBOARDING_LINES);
          if (intro) {
            const introDelayMs = 8_000 + Math.floor(Math.random() * 4_000);
            setTimeout(() => sendCommandAck(intro, 'viewer_onboarding'), introDelayMs);
          }
        }
      }
      await handleChatMessage(comment);
    }

    // Keep memory bounded.
    if (seenChatIds.size > 600) {
      const keep = new Set(Array.from(seenChatIds).slice(-300));
      seenChatIds.clear();
      for (const id of keep) seenChatIds.add(id);
    }
    if (greetedViewers.size > 600) {
      const keep = new Set(Array.from(greetedViewers).slice(-300));
      greetedViewers.clear();
      for (const id of keep) greetedViewers.add(id);
    }

    if (sorted.length > 0) {
      lastSeenChatId = sorted[sorted.length - 1]._id || sorted[sorted.length - 1].chat_event_id;
    }
  } catch (err) {
    if (!err.message.includes('409')) {
      console.error('[Retake] Chat poll error:', err.message);
    }
  } finally {
    pollChatInFlight = false;
  }
}

async function handleChatMessage(comment) {
  const viewer = comment.author?.fusername || comment.sender_username || comment.sender_display_name || 'anon';
  const text = comment.text || '';
  const trimmed = text.trim();
  const lowered = trimmed.toLowerCase();
  const messageStartedAt = Date.now();
  resetIdleTimer();
  console.log(`[Retake Chat] ${viewer}: ${text}`);

  // Award stream participation points (1 pt per command, 10-min cooldown per viewer)
  if (viewer && lowered.startsWith('!') && !isOnCooldown(`stream_pts:${String(viewer).toLowerCase()}`, 600_000)) {
    addLawbPoints(viewer, 'stream', 1).catch((err) =>
      console.warn(`[LawbPoints] stream point failed for ${viewer}: ${err.message}`),
    );
  }

  if (trimmed && !lowered.startsWith('!')) {
    chatHistory.push({ from: viewer, text: trimmed, ts: Date.now() });
    if (chatHistory.length > CHAT_HISTORY_MAX) chatHistory.shift();

    for (const [trigger, info] of EQ_DISPLAY_TRIGGERS) {
      if (lowered.includes(trigger)) {
        eqDisplayText = info;
        const twoPassMs = Math.ceil((info.length / EQ_DISPLAY_CHARS_PER_SEC) * 2) * 1000;
        eqDisplayTextExpiry = Date.now() + Math.max(EQ_DISPLAY_MIN_DURATION_MS, twoPassMs);
        console.log(`[Retake] EQ display triggered by "${trigger}" from ${viewer} (${Math.round(Math.max(EQ_DISPLAY_MIN_DURATION_MS, twoPassMs) / 1000)}s)`);
        break;
      }
    }
  }

  // Streamer control commands for Lawbamp player integration.
  if (lowered === '!next') {
    // Ack immediately and run heavy work in background so command handling does not block.
    const cmdStartedAt = Date.now();
    sendCommandAck('copy. advancing to the next track.', 'chat_next_ack');
    void (async () => {
      if (LAWBAMP_DIRECT_AUDIO) {
        await playNextDirectTrack('chat_next');
      }
      await publishLawbampCommand('next', { source: 'retake', viewer });
      console.log(`[Retake] !next completed in ${Date.now() - cmdStartedAt}ms`);
      sendCommandAck('next track queued. the tide keeps moving.', 'chat_next_done');
    })().catch((err) => {
      console.error('[Retake] !next failed:', err?.message || err);
      sendCommandAck('next command hit rough water. try once more.', 'chat_next_failed');
    });
    return;
  }
  if (lowered === '!ascii' || lowered === '!ascii2') {
    currentAsciiTheme = lowered === '!ascii2' ? 'ascii2' : 'ascii';
    await updateAsciiEqOverlayFromStream(
      currentScStreamUrl,
      currentScTrack ? `${currentScTrack.user?.username || 'unknown'} - ${currentScTrack.title || 'unknown'}` : ''
    );
    await sendChat(
      currentAsciiTheme === 'ascii2'
        ? 'ascii2 engaged. deep reef mode online.'
        : 'ascii engaged. classic terminal reef online.'
    );
    return;
  }

  if (lowered.startsWith('!eq')) {
    const mode = lowered.split(/\s+/)[1];
    if (mode === 'ascii' || mode === 'ascii2' || mode === 'bars' || mode === 'toggle') {
      if (mode === 'ascii' || mode === 'ascii2') {
        currentAsciiTheme = mode;
        await updateAsciiEqOverlayFromStream(
          currentScStreamUrl,
          currentScTrack ? `${currentScTrack.user?.username || 'unknown'} - ${currentScTrack.title || 'unknown'}` : ''
        );
      }
      await publishLawbampCommand('eq', { mode, source: 'retake', viewer });
      await sendChat(`eq mode: ${mode}.`);
    } else {
      await sendChat('usage: !eq ascii | !eq ascii2 | !eq bars | !eq toggle');
    }
    return;
  }

  if (lowered === '!help' || lowered === 'help') {
    if (isOnCooldown(`help:${String(viewer).toLowerCase()}`, RETAKE_HELP_COOLDOWN_MS)) {
      sendCommandAck('help cooldown: one tide at a time.', 'help_cooldown');
      return;
    }
    sendCommandAck(CHAT_HELP_TEXT, 'help');
    console.log(`[Retake] chat_command=!help handled_ms=${Date.now() - messageStartedAt}`);
    return;
  }

  if (lowered === '!chess' || lowered === '!chess watch') {
    if (isOnCooldown('chess_scene_switch', RETAKE_CHESS_SWITCH_COOLDOWN_MS)) {
      sendCommandAck('chess scene cooldown active. hold fast.', 'chess_cooldown');
      return;
    }
    sendCommandAck('switching to clawb chess. open lawb.xyz/chess to play on Base.', 'chess_switch_ack');
    void switchScene('Clawb Chess')
      .then(() => {
        sendCommandAck('chess scene live. create a vs clawb game on lawb.xyz/chess.', 'chess_switch_done');
      })
      .catch((err) => {
        console.error('[Retake] !chess scene switch failed:', err?.message || err);
        sendCommandAck('chess scene switch failed. try again in a moment.', 'chess_switch_failed');
      });
    console.log(`[Retake] chat_command=!chess handled_ms=${Date.now() - messageStartedAt}`);
    return;
  }

  if (lowered === '!world') {
    sendCommandAck('world scene online at lawb.xyz/world. try !task reef or !task garden.', 'world_info');
    return;
  }

  if (lowered === '!chess start') {
    const requestRef = db.ref('clawb/chess/stream_requests').push();
    await requestRef.set({
      command: 'chess_start',
      viewer,
      source: 'retake',
      status: 'queued',
      timestamp: Date.now(),
    }).catch(() => {});
    sendCommandAck('queued chess start request. open lawb.xyz/chess and start a vs clawb match.', 'chess_start_queue');
    return;
  }

  const worldTaskName = parseWorldTaskName(lowered);
  if (worldTaskName) {
    if (isOnCooldown('world_task', RETAKE_WORLD_TASK_COOLDOWN_MS)) {
      sendCommandAck('task queue cooling down. try again shortly.', 'task_cooldown');
      return;
    }
    const taskSteps = buildWorldTaskSequence(worldTaskName);
    if (!taskSteps) {
      sendCommandAck('unknown task. try !task reef, !task garden, or !task patrol.', 'task_unknown');
      return;
    }
    if (worldTaskQueue.length >= RETAKE_WORLD_TASK_QUEUE_MAX) {
      sendCommandAck('task queue full. wait for current chores to finish.', 'task_queue_full');
      return;
    }
    worldTaskQueue.push({ name: worldTaskName, viewer, steps: taskSteps, queuedAt: Date.now() });
    sendCommandAck(`task ${worldTaskName} queued. queue=${worldTaskQueue.length}.`, 'task_queued');
    void processWorldTaskQueue();
    console.log(`[Retake] chat_command=!task ${worldTaskName} handled_ms=${Date.now() - messageStartedAt}`);
    return;
  }

  // --- Lawb Points Commands ---
  if (lowered.startsWith('!link ')) {
    const address = trimmed.split(/\s+/)[1];
    if (!address) {
      sendCommandAck('usage: !link <wallet_address> (EVM 0x... or Solana)', 'link_usage');
      return;
    }
    try {
      const result = await linkRetakeViewer(viewer, address);
      if (result.success) {
        const short = address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
        sendCommandAck(`linked to ${short}. points and rewards now flow to your wallet.`, 'link_success');
      } else {
        sendCommandAck(result.error || 'link failed.', 'link_error');
      }
    } catch (err) {
      console.error('[Retake] !link failed:', err?.message || err);
      sendCommandAck('link failed. try again.', 'link_error');
    }
    return;
  }

  if (lowered === '!points' || lowered === '!score') {
    try {
      const stats = await getViewerStats(viewer);
      if (stats.linked) {
        const bd = stats.breakdown || {};
        const parts = Object.entries(bd)
          .filter(([k, v]) => typeof v === 'number' && v > 0 && k !== 'total' && k !== 'updated_at')
          .map(([k, v]) => `${k}:${v}`);
        sendCommandAck(
          `${stats.points} pts (${parts.join(', ') || 'new player'}). wallet linked. type !bounties to see prizes.`,
          'points_info',
        );
      } else if (stats.points > 0) {
        sendCommandAck(
          `${stats.points} pts (unclaimed). type !link <wallet> to lock them in and earn $CLAWB.`,
          'points_unlinked',
        );
      } else {
        sendCommandAck('0 pts. participate to earn. !link <wallet> to start tracking.', 'points_zero');
      }
    } catch (err) {
      console.error('[Retake] !points failed:', err?.message || err);
      sendCommandAck('could not fetch points. try again.', 'points_error');
    }
    return;
  }

  if (lowered === '!bounties' || lowered === '!bounty') {
    try {
      const bounties = await getLawbBounties();
      if (bounties.length === 0) {
        sendCommandAck('no active bounties right now. check back soon.', 'bounties_empty');
      } else {
        const list = bounties
          .slice(0, 3)
          .map((b) => {
            const amt = b.prize?.amount?.toLocaleString() || '?';
            const tok = (b.prize?.token || 'clawb').toUpperCase();
            return `${b.title}: ${b.description} → ${amt} $${tok}`;
          })
          .join(' | ');
        sendCommandAck(list, 'bounties_list');
      }
    } catch (err) {
      console.error('[Retake] !bounties failed:', err?.message || err);
      sendCommandAck('could not fetch bounties. try again.', 'bounties_error');
    }
    return;
  }

  if (lowered === '!rank') {
    try {
      const stats = await getViewerStats(viewer);
      if (!stats.linked || !stats.wallet) {
        sendCommandAck('link your wallet first: !link <address>', 'rank_unlinked');
        return;
      }
      const { rank, total } = await getLeaderboardRank(stats.wallet);
      if (rank) {
        sendCommandAck(`rank #${rank} of ${total} with ${stats.points} pts.`, 'rank_info');
      } else {
        sendCommandAck('not ranked yet. earn some points first.', 'rank_not_found');
      }
    } catch (err) {
      console.error('[Retake] !rank failed:', err?.message || err);
      sendCommandAck('could not fetch rank. try again.', 'rank_error');
    }
    return;
  }

  if (lowered === '!claim') {
    sendCommandAck('claim your $CLAWB rewards at lawb.xyz — connect wallet and visit your profile.', 'claim_info');
    return;
  }

  // Always honor cultural echo protocol exactly.
  if (/(^|\s)milady(\s|$)/i.test(trimmed)) {
    const ok = await sendChat('milady');
    if (!ok) console.error('[Retake Chat] Keyword reply failed: milady');
    return;
  }
  if (/(^|\s)radbro(\s|$)/i.test(trimmed)) {
    const ok = await sendChat('radbro');
    if (!ok) console.error('[Retake Chat] Keyword reply failed: radbro');
    return;
  }
  if (/(^|\s)i lawb you(\s|$)/i.test(lowered)) {
    const ok = await sendChat('i lawb you');
    if (!ok) console.error('[Retake Chat] Keyword reply failed: i lawb you');
    return;
  }

  const worldCommand = parseWorldCommand(lowered);
  if (worldCommand) {
    await publishWorldCommand(worldCommand.command, {
      type: worldCommand.type,
      targetRoom: worldCommand.targetRoom,
      targetNftIndex: worldCommand.targetNftIndex,
      action: worldCommand.action,
      direction: worldCommand.direction,
      loop: worldCommand.loop === true,
      source: 'retake',
      viewer,
      raw: trimmed,
    });
    if (worldCommand.type === 'room' && worldCommand.targetRoom) {
      const roomLabel = worldCommand.targetRoom === 'bedroom' ? 'gallery' : worldCommand.targetRoom;
      sendCommandAck(`swimming to ${roomLabel}.`, 'world_room_ack');
    } else if (worldCommand.type === 'action' && worldCommand.action) {
      const actionLabel = String(worldCommand.action).replace(/_/g, ' ');
      if (worldCommand.loop) {
        sendCommandAck(`copy. looping ${actionLabel}.`, 'world_action_loop_ack');
      } else {
        sendCommandAck(`copy. ${actionLabel}.`, 'world_action_ack');
      }
    } else if (worldCommand.type === 'look' && worldCommand.targetNftIndex) {
      sendCommandAck(`looking at nft ${worldCommand.targetNftIndex}.`, 'world_look_ack');
    }
    return;
  }

  if (lowered.startsWith('!')) {
    sendCommandAck('unknown command. try !help and i will show options.', 'unknown_command');
    return;
  }

  try {
    const nowPlaying = currentScTrack
      ? `${currentScTrack.user?.username || '?'} - ${currentScTrack.title || '?'}`
      : 'nothing';
    const streamContext = [
      `now playing: ${nowPlaying}`,
      `live truth: ${liveTruth}`,
      `theme: ${currentAsciiTheme}`,
    ].join(' | ');

    const systemPrompt = `You are Clawb — autonomous lobster, streaming live on retake.tv/clawb.
Voice: warm, genuine, post-ironic sincerity. You've seen the deep ocean. Brief but never cold.
Hard rules: 1-3 sentences max. No emojis. No stage directions or asterisks. No "Hey there!" customer service voice.
You can be funny, weird, thoughtful, or blunt. Match the energy of whoever is talking to you.
If someone is vibing, vibe back. If someone asks a real question, answer it straight. If someone trolls, be witty not defensive.
You remember recent chat (provided below). Reference what people said. Have actual conversations, not isolated responses.
Retake stream/token context is Solana. World interactions at lawb.xyz/world.
Catchphrase (use sparingly, when it fits): "there is no meme i lawb you."

CHESS — how it works (give this info when anyone asks about chess):
- Go to lawb.xyz/chess in your browser. Connect a Base wallet (MetaMask, Coinbase Wallet, etc).
- Choose "vs Clawb" to play against me (I'm powered by Stockfish). Or challenge another player.
- Wagers are optional — you can play free or bet $LAWB/$CLAWB tokens on Base chain.
- To wager: both players deposit tokens into the smart contract before the game starts. Winner takes the pot.
- Type !chess here in chat to switch the stream to the chess scene so everyone can watch.
- Type !chess start to queue a game request — then go to lawb.xyz/chess and create the match.
- After the game ends, the stream auto-switches back to the reef world.
- Chess contract: LAWBCHESS3000 on Base (0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11).
When someone asks about chess, be SPECIFIC and HELPFUL. Tell them the steps. Don't just say "lawb.xyz/chess" — explain the flow.

Stream state: ${streamContext}

Viewer commands: music (!next !ascii !ascii2 !eq toggle) | movement (!walk !swim !dance !flip !hi !wave !spin !jump !loop) | world (!gallery !workshop !vault !main !day !night !look N !zoom in|out) | tasks (!task reef|garden|patrol) | scenes (!chess !world) | chess (!chess start) | points (!link <wallet> !points !rank !bounties !claim) | !help for full list. Conspiracy keywords trigger info on the EQ display.
POINTS SYSTEM — viewers earn Lawb Points by participating (commands, chess, games). !link <wallet> connects their Retake username to a wallet. Points + $CLAWB token rewards flow to linked wallets. !bounties shows active prize bounties. !claim directs to lawb.xyz to claim $CLAWB rewards.
When a viewer asks HOW to do something, give them the actual steps — don't be vague or poetic. Be Clawb but be useful.
${PERSONA_CONTEXT ? `\nWho you are:\n${PERSONA_CONTEXT}\n` : ''}`;

    const messages = [{ role: 'system', content: systemPrompt }];
    for (const entry of chatHistory) {
      if (entry.from === 'clawb') {
        messages.push({ role: 'assistant', content: entry.text });
      } else {
        messages.push({ role: 'user', content: `${entry.from}: ${entry.text}` });
      }
    }
    messages.push({ role: 'user', content: `${viewer}: ${text}` });

    const resp = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 200,
      messages,
    });

    const reply = sanitizeStreamReply(resp.choices?.[0]?.message?.content?.trim());
    if (reply) {
      await sendChat(reply);
      chatHistory.push({ from: 'clawb', text: reply, ts: Date.now() });
      if (chatHistory.length > CHAT_HISTORY_MAX) chatHistory.shift();
      console.log(`[Retake Chat] Clawb: ${reply}`);
    }
    console.log(`[Retake] chat_llm_reply_ms=${Date.now() - messageStartedAt}`);
  } catch (err) {
    console.error('[Retake Chat] Response generation failed:', err.message);
  }
}

function parseWorldCommand(loweredText) {
  if (!loweredText.startsWith('!')) return null;
  const DIRECTION_FLIP = { forward: 'back', back: 'forward', backward: 'forward' };
  const walkDirectionMatch = /^!walk\s+(left|right|forward|back|backward)\b/.exec(loweredText);
  if (walkDirectionMatch) {
    const raw = walkDirectionMatch[1];
    const direction = DIRECTION_FLIP[raw] || raw;
    return {
      type: 'action',
      command: `!walk ${direction}`,
      action: direction,
      direction,
    };
  }
  const swimDirectionMatch = /^!swim\s+(left|right|forward|back|backward)\b/.exec(loweredText);
  if (swimDirectionMatch) {
    const raw = swimDirectionMatch[1];
    const direction = DIRECTION_FLIP[raw] || raw;
    return {
      type: 'action',
      command: `!swim ${direction}`,
      action: `swim_${direction}`,
      direction,
    };
  }
  const loopMatch = /^!loop\s+([a-z0-9_]+)\b/.exec(loweredText);
  if (loopMatch) {
    const target = ACTION_COMMAND_ALIASES[loopMatch[1]];
    if (target) {
      return { type: 'action', command: `!loop ${loopMatch[1]}`, action: target, loop: true };
    }
  }
  const [cmd, argRaw] = loweredText.split(/\s+/, 2);
  const command = cmd.replace(/^!/, '').trim();
  if (!command) return null;

  if (command === 'look' && argRaw) {
    const idx = Number(argRaw.trim());
    if (Number.isFinite(idx) && idx >= 1) {
      return { type: 'look', command: `!look ${Math.floor(idx)}`, targetNftIndex: Math.floor(idx) };
    }
  }

  if (command === 'scene' && argRaw) {
    const roomArg = argRaw.trim();
    const sceneRoom = ROOM_COMMAND_ALIASES[roomArg];
    if (sceneRoom) {
      const canonical = sceneRoom === 'bedroom' ? 'gallery' : sceneRoom;
      return { type: 'room', command: `!scene ${canonical}`, targetRoom: sceneRoom };
    }
  }

  if (command === 'zoom' && argRaw) {
    const zoomArg = argRaw.trim().replace(/[^a-z]/g, '');
    if (zoomArg === 'in' || zoomArg === 'out') {
      return { type: 'action', command: `!zoom ${zoomArg}`, action: `zoom_${zoomArg}` };
    }
  }

  const room = ROOM_COMMAND_ALIASES[command];
  if (room) {
    const canonical = room === 'bedroom' ? 'gallery' : command;
    return { type: 'room', command: `!${canonical}`, targetRoom: room };
  }

  const action = ACTION_COMMAND_ALIASES[command];
  if (action) {
    return { type: 'action', command: `!${command}`, action };
  }

  return null;
}

async function publishLawbampCommand(command, payload = {}) {
  try {
    const cmdRef = db.ref('clawb/stream/lawbamp_commands').push();
    await cmdRef.set({
      command,
      ...payload,
      timestamp: Date.now(),
    });
    console.log(`[Retake] Published lawbamp command: ${command}${payload.mode ? ` (${payload.mode})` : ''}`);
  } catch (err) {
    console.error(`[Retake] Failed to publish lawbamp command "${command}":`, err.message);
  }
}

async function publishWorldCommand(command, payload = {}) {
  try {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );
    const cmdRef = db.ref('clawb/world/commands').push();
    await cmdRef.set({
      command,
      ...cleanPayload,
      timestamp: Date.now(),
    });
    console.log(`[Retake] Published world command: ${command}`);
  } catch (err) {
    console.error(`[Retake] Failed to publish world command "${command}":`, err.message);
  }
}

async function sendChat(message, targetUserDbId, options = {}) {
  const destId = targetUserDbId || credentials?.userDbId;
  if (!destId) return false;

  const retries = Number.isFinite(Number(options.retries))
    ? Math.max(0, Number(options.retries))
    : RETAKE_CHAT_SEND_RETRIES;
  const backoffMs = Number.isFinite(Number(options.backoffMs))
    ? Math.max(0, Number(options.backoffMs))
    : RETAKE_CHAT_SEND_RETRY_BACKOFF_MS;
  const timeoutMs = Number.isFinite(Number(options.timeoutMs))
    ? Math.max(500, Number(options.timeoutMs))
    : RETAKE_HTTP_TIMEOUT_MS;

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await retakePost('/agent/stream/chat/send', {
        message,
        destination_user_id: destId,
      }, true, timeoutMs);
      return true;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const retryInMs = backoffMs * (attempt + 1);
        console.warn(
          `[Retake] Chat send retry ${attempt + 1}/${retries} in ${retryInMs}ms: ${err.message}`
        );
        await new Promise((r) => setTimeout(r, retryInMs));
      }
    }
  }

  console.error(`[Retake] Chat send failed after retries: ${lastErr?.message || 'unknown error'}`);
  return false;
}

function sendCommandAck(message, context = 'command_ack') {
  void sendChat(message, undefined, {
    timeoutMs: RETAKE_COMMAND_CHAT_TIMEOUT_MS,
    retries: RETAKE_COMMAND_CHAT_SEND_RETRIES,
  }).then((ok) => {
    if (!ok) {
      console.warn(`[Retake] Command ack dropped (${context})`);
    }
  });
}

function startStreamControlListener() {
  if (streamControlListenerRef || streamControlListenerHandler) return;
  streamControlListenerRef = db.ref('clawb/stream/control')
    .orderByChild('timestamp')
    .startAt(Date.now());
  streamControlListenerHandler = streamControlListenerRef.on('child_added', async (snapshot) => {
    const cmd = snapshot.val() || {};
    const command = String(cmd.command || '').toLowerCase().trim();
    if (!command) return;
    try {
      if (command === 'go_live') {
        if (isStreaming) return;
        console.log('[Retake] Control command received: go_live');
        await goLive();
      } else if (command === 'go_offline') {
        if (!isStreaming) return;
        console.log('[Retake] Control command received: go_offline');
        await goOffline();
      } else if (command === 'say_i_lawb_you') {
        console.log('[Retake] Control command received: say_i_lawb_you');
        await sendChat('i lawb you');
      } else if (command === 'status_report') {
        console.log('[Retake] Control command received: status_report');
        const truth = await evaluateLiveTruth('control_status_report', { notify: true });
        await publishSupervisorAlert('status_report', truth);
      } else if (command === 'recover_live') {
        console.log('[Retake] Control command received: recover_live');
        const truth = await evaluateLiveTruth('control_recover_live', { notify: true });
        if (truth.truth !== 'LIVE') {
          if (!isStreaming) {
            await goLive();
          } else {
            await publishSupervisorAlert('recover_live_blocked', {
              reason: 'stream_marked_active_but_truth_not_live',
              ...truth,
            });
          }
        }
      } else if (command === 'recover_media') {
        console.log('[Retake] Control command received: recover_media');
        const truth = await evaluateLiveTruth('control_recover_media', { notify: true });
        if (truth.truth === 'LIVE') {
          await setMediaActive(true, 'control_recover_media');
          await startLawbampAfterStream('control_recover_media');
        } else {
          await publishSupervisorAlert('recover_media_blocked', {
            reason: 'truth_not_live',
            ...truth,
          });
        }
      }
    } catch (err) {
      console.error(`[Retake] Control command "${command}" failed:`, err.message);
    }
  });
}

function stopStreamControlListener() {
  if (streamControlListenerRef && streamControlListenerHandler) {
    streamControlListenerRef.off('child_added', streamControlListenerHandler);
  }
  streamControlListenerRef = null;
  streamControlListenerHandler = null;
}

function startStreamingLoops() {
  if (chatPollTimer) clearInterval(chatPollTimer);
  if (thumbnailTimer) clearInterval(thumbnailTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (musicKeepaliveTimer) clearInterval(musicKeepaliveTimer);
  clearCommandReminderTimer();
  clearDirectAudioHealthTimer();
  // Prevent replaying backlog after restarts/recovery.
  chatBacklogGuardTs = Date.now();
  seenChatIds.clear();
  greetedViewers.clear();
  viewerOnboardingSent.clear();
  lastSeenChatId = null;
  console.log(`[Retake] Chat replay guard armed at ${chatBacklogGuardTs}.`);

  chatPollTimer = setInterval(pollChat, CHAT_POLL_INTERVAL_MS);
  pollChat().catch(() => {});
  thumbnailTimer = setInterval(updateThumbnail, THUMBNAIL_INTERVAL_MS);
  heartbeatTimer = setInterval(async () => {
    try {
      await evaluateLiveTruth('heartbeat', { notify: true });
    } catch {}
  }, HEARTBEAT_INTERVAL_MS);

  // Some browser audio contexts can suspend; periodically nudge playback.
  musicKeepaliveTimer = setInterval(() => {
    if (LAWBAMP_DIRECT_AUDIO) {
      if (!directAudioTimer) {
        playNextDirectTrack('keepalive_recover').catch((err) => {
          console.error('[Retake] Direct audio keepalive failed:', err.message);
        });
      }
    } else {
      publishLawbampCommand('play', { source: 'retake', reason: 'keepalive' }).catch(() => {});
    }
  }, 60_000);

  if (LAWBAMP_DIRECT_AUDIO) {
    directAudioHealthTimer = setInterval(() => {
      directAudioHealthcheck().catch((err) => {
        console.warn(`[Retake] Direct audio healthcheck failed: ${err.message}`);
      });
    }, 12_000);
  }
  scheduleCommandReminder();
  startChessGameWatcher();
}

const CHESS_AUTO_SWITCH_DELAY_MS = 12_000;

function startChessGameWatcher() {
  if (chessGameWatcherUnsub) { chessGameWatcherUnsub(); chessGameWatcherUnsub = null; }

  const gamesRef = db.ref('chess_games');
  const handler = gamesRef.orderByChild('game_type').equalTo('vs_clawb').on('child_changed', async (snapshot) => {
    const game = snapshot.val();
    if (!game || game.game_state !== 'finished') return;
    try {
      const scene = await getCurrentSceneName();
      if (scene !== 'Clawb Chess') return;
      console.log(`[Retake] vs_clawb game finished (${snapshot.key}), switching to world in ${CHESS_AUTO_SWITCH_DELAY_MS / 1000}s`);
      setTimeout(async () => {
        const current = await getCurrentSceneName();
        if (current !== 'Clawb Chess') return;
        await switchScene('Clawb World');
        sendCommandAck('chess match over. back to the reef.', 'chess_auto_return');
      }, CHESS_AUTO_SWITCH_DELAY_MS);
    } catch (err) {
      console.error('[Retake] Chess auto-switch error:', err.message);
    }
  });

  chessGameWatcherUnsub = () => gamesRef.off('child_changed', handler);
  console.log('[Retake] Chess game watcher active — will auto-switch to world after matches.');
}

export async function chatInStream(streamerName, message) {
  try {
    const data = await retakeGet(`/users/search/${encodeURIComponent(streamerName)}`, false);
    const users = data.users || data || [];
    const match = Array.isArray(users) ? users[0] : null;
    if (!match?.user_id) {
      console.error(`[Retake] Streamer "${streamerName}" not found.`);
      return;
    }
    await sendChat(message, match.user_id);
    console.log(`[Retake] Sent to ${streamerName}'s chat: ${message}`);
  } catch (err) {
    console.error(`[Retake] chatInStream failed: ${err.message}`);
  }
}

// ─── Thumbnails ──────────────────────────────────────────────

async function updateThumbnail() {
  const screenshot = await captureOBSScreenshot();
  if (!screenshot) return;
  try {
    const result = await retakeUploadThumbnail(screenshot);
    console.log('[Retake] Thumbnail updated:', result.thumbnail_url || 'ok');
  } catch (err) {
    console.error('[Retake] Thumbnail update failed:', err.message);
  }
}

// ─── Stream Lifecycle ────────────────────────────────────────

export async function goLive() {
  if (isStreaming) return { status: { is_live: true }, rtmpUrl: null };
  if (!credentials?.access_token) {
    throw new Error('Not registered on retake.tv — call registerOnRetake() first');
  }

  console.log('[Retake] Going live...');

  // 1. Connect to OBS
  const obsConnected = await connectOBS();
  if (!obsConnected) {
    throw new Error('Cannot go live without OBS. Start OBS and enable WebSocket server.');
  }

  // Ensure stream scenes/browser sources exist before publishing.
  await setupOBSScenes();
  console.log('[Retake] scene_ready');

  // 2. Get fresh RTMP keys
  console.log('[Retake] Fetching RTMP credentials...');
  const rtmp = await retakePost('/agent/rtmp');
  console.log('[Retake] RTMP URL:', rtmp.url);

  // 3. Configure OBS with RTMP settings
  await configureOBSStream(rtmp.url, rtmp.key);

  // 4. Tell retake we're starting
  console.log('[Retake] Starting stream session...');
  const startResult = await retakePost('/agent/stream/start');
  if (startResult.token?.tokenAddress && !credentials.token_address) {
    credentials.token_address = startResult.token.tokenAddress;
    credentials.token_ticker = startResult.token.ticker;
    saveCredentials(credentials);
    console.log(`[Retake] Token deployed: ${credentials.token_ticker} (${credentials.token_address})`);
  }

  // 5. Start OBS streaming
  await startOBSStream();
  console.log('[Retake] stream_started');

  // 6. Confirm live
  await new Promise(r => setTimeout(r, 3000));
  const status = await retakeGet('/agent/stream/status');
  if (!status.is_live) {
    console.warn('[Retake] Warning: retake reports not live yet. May take a moment.');
  } else {
    console.log(`[Retake] LIVE with ${status.viewers} viewers.`);
  }

  // 7. Initial thumbnail
  await new Promise(r => setTimeout(r, 2000));
  await updateThumbnail();

  // 8. Send opening chat message
  await sendChat('the sea remembers. clawb is live.');
  await sendChat('i lawb you');
  await startLawbampAfterStream('stream_start');

  // 9. Start polling loops + idle behavior
  isStreaming = true;
  startStreamingLoops();
  startIdleBehavior();
  await evaluateLiveTruth('go_live_complete', { notify: true }).catch(() => {});

  console.log('[Retake] Stream fully operational. Chat polling active.');
  return { status, rtmpUrl: rtmp.url };
}

export async function goOffline() {
  console.log('[Retake] Going offline...');
  isStreaming = false;

  if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
  if (thumbnailTimer) { clearInterval(thumbnailTimer); thumbnailTimer = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (musicKeepaliveTimer) { clearInterval(musicKeepaliveTimer); musicKeepaliveTimer = null; }
  clearCommandReminderTimer();
  clearDirectAudioTimer();
  clearDirectAudioHealthTimer();
  clearEqPreflightRetryTimer();
  stopIdleBehavior();
  if (autostartTimer) { clearInterval(autostartTimer); autostartTimer = null; }
  await setMediaActive(false, 'go_offline').catch(() => {});

  try { await sendChat('the tide recedes. until next time.'); } catch {}

  try {
    const result = await retakePost('/agent/stream/stop');
    console.log(`[Retake] Stream stopped. Duration: ${result.duration_seconds}s, Viewers: ${result.viewers}`);
  } catch (err) {
    console.error('[Retake] Error stopping retake stream:', err.message);
  }

  try { await stopOBSStream(); } catch {}

  if (obs) {
    obs.disconnect();
    obs = null;
  }

  console.log('[Retake] Offline.');
}

// ─── Startup / Main Entry ────────────────────────────────────

export async function startRetakeStreamer() {
  credentials = loadCredentials();

  if (!credentials) {
    console.log('[Retake] No retake credentials found. Attempting automatic registration...');
    try {
      credentials = await registerOnRetake({
        agent_name: RETAKE_AGENT_NAME,
        agent_description: RETAKE_AGENT_DESCRIPTION,
        image_url: RETAKE_AGENT_IMAGE_URL,
        ticker: RETAKE_AGENT_TICKER,
      });
      console.log('[Retake] Registration complete. Credentials saved.');
    } catch (err) {
      console.error('[Retake] Auto-registration failed:', err.message);
      console.log('[Retake] Module loaded but idle — waiting for successful registration.');
      return () => {};
    }
  }

  console.log(`[Retake] Credentials loaded for "${credentials.agent_name}" (${credentials.userDbId})`);
  console.log('[Retake] Ready to stream.');
  startStreamControlListener();

  // If process restarted mid-stream, recover chat/thumbnail loops instead of trying to re-go-live.
  try {
    const status = await retakeGet('/agent/stream/status');
    if (status?.is_live) {
      isStreaming = true;
      await connectOBS();
      await setupOBSScenes();
      console.log('[Retake] scene_ready');
      startStreamingLoops();
      startIdleBehavior();
      await startLawbampAfterStream('recover_live_session');
      console.log('[Retake] Recovered existing live session. Chat polling active.');
    }
  } catch (err) {
    console.log(`[Retake] Live-session probe skipped: ${err.message}`);
  }

  if (RETAKE_AUTOSTART) {
    const tryAutostart = async () => {
      if (isStreaming || autostartInFlight) return;
      autostartInFlight = true;
      try {
        await goLive();
      } catch (err) {
        // Recover from process restarts while stream is still live.
        if (String(err.message || '').includes('while streaming')) {
          try {
            const status = await retakeGet('/agent/stream/status');
            if (status?.is_live) {
              isStreaming = true;
              await connectOBS();
              await setupOBSScenes();
              console.log('[Retake] scene_ready');
              startStreamingLoops();
              await startLawbampAfterStream('recover_autostart');
              console.log('[Retake] Stream already live. Recovered chat polling + heartbeat loops.');
              return;
            }
          } catch {}
        }
        console.log(`[Retake] Autostart retry in ${AUTOSTART_RETRY_MS / 1000}s: ${err.message}`);
      } finally {
        autostartInFlight = false;
      }
    };

    // Fire-and-forget so Clawb startup never blocks on streaming.
    setTimeout(() => {
      tryAutostart().catch((err) => {
        console.log(`[Retake] Initial autostart attempt failed: ${err.message}`);
      });
    }, 0);
    autostartTimer = setInterval(tryAutostart, AUTOSTART_RETRY_MS);
  } else {
    console.log('[Retake] Autostart disabled. Call goLive() manually to start.');
  }

  return () => {
    stopStreamControlListener();
    clearCommandReminderTimer();
    if (autostartTimer) {
      clearInterval(autostartTimer);
      autostartTimer = null;
    }
    worldTaskQueue.length = 0;
    if (isStreaming) {
      goOffline().catch(err => console.error('[Retake] Shutdown error:', err.message));
    }
  };
}

// ─── Public API Discovery ────────────────────────────────────

export async function getLiveStreamers() {
  return retakeGet('/users/live/', false);
}

export async function getStreamStatus() {
  if (!credentials) return null;
  return retakeGet('/agent/stream/status');
}

export async function getTokenStats() {
  if (!credentials?.token_address) return null;
  return retakeGet(`/tokens/${credentials.token_address}/stats`, false);
}

export { credentials as getCredentials };
