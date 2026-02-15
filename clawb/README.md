# Clawb Agent — Setup Guide (Windows PC)

Clawb is the autonomous Lawbster agent for lawb.xyz. He answers chat, commentates chess games, and plays PVP wagers on-chain.

## Run Clawb

In a terminal (Cursor or PowerShell):

```
cd c:\Users\wable\lawb2\clawb
node index.js
```

You’ll see logs in that terminal. Ctrl+C to stop. Only run one Clawb at a time.

---

## New machine / clawb2: get up to speed

Same identity, new box. Read these in order:

1. **`CLAWB_IDENTITY.md`** — Who Clawb is, voice, catchphrase, DO/DON'T.
2. **`LAWB_XYZ_KNOWLEDGE.md`** — Site knowledge (routes, collections, chess, minting).
3. **`.env.example`** → copy to `.env` and fill in secrets (Firebase key, OpenRouter, Clawb wallet key).

Then: `npm install` → `node test-firebase.js` → `node index.js` (or `--no-pvp` / `--chat-only`). See steps below for details.

---

## Getting latest updates (stay up to speed)

The lawb2 repo deploys from **`main`**. To run the latest Clawb agent (50% balance rule, move validation, 60‑min timeout, etc.):

```bash
cd C:\Users\wable\lawb2
git pull origin main
cd clawb
npm install
node index.js
```

If you have local changes: `git stash` first, then pull, then `npm install` and restart.

---

## Prerequisites

1. **Node.js 18+** — Download from https://nodejs.org
2. **Git** — Download from https://git-scm.com
3. **Cursor** — Already installed

## Step 1: Clone the repo

```bash
git clone https://github.com/wables411/lawb2.git
cd lawb2/clawb
```

## Step 2: Install dependencies

```bash
npm install
```

## Step 3: Get the secrets

You need 3 things:

### A. Firebase Service Account Key

1. Go to https://console.firebase.google.com
2. Select project **chess-220ee**
3. Click the gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as `service-account.json` in this `clawb/` directory

### B. OpenRouter API Key

1. Go to https://openrouter.ai/keys
2. Create a new key (or use your existing one)
3. Copy it — you'll need it for the .env file

### C. Clawb's Wallet Private Key

You already have this. It's the private key for wallet `0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429`.

## Step 4: Create .env file

Copy the example and fill in your values:

```bash
copy .env.example .env
```

Then edit `.env`:

```
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
FIREBASE_DATABASE_URL=https://chess-220ee-default-rtdb.firebaseio.com
OPENROUTER_API_KEY=sk-or-v1-your-key-here
CLAWB_PRIVATE_KEY=0xyour-private-key-here
BASE_RPC_URL=https://mainnet.base.org
STOCKFISH_API_URL=https://chess.lawb.xyz/api/stockfish
```

## Step 5: Test the connection

```bash
node test-firebase.js
```

You should see:
```
[Test] Firebase read/write working!
[Test] All tests passed! Firebase connection is working.
```

## Step 6: Start Clawb

See **Run Clawb** at the top. From `clawb/`: `node index.js`. Optional: `node index.js --no-pvp` (no wagers), `node index.js --chat-only` (chat only).

## What each module does

| Script | What it does |
|--------|-------------|
| `index.js` | Main entry point — starts all services |
| `lawb-firebase.js` | Firebase Admin SDK connection + helpers |
| `lawb-chat-responder.js` | Listens for visitor messages, responds via Claude |
| `chess-clawb-watcher.js` | Watches vs Clawb chess games, posts commentary |
| `chess-pvp-agent.js` | Watches for open PVP games, joins + plays on-chain |
| `LAWB_XYZ_KNOWLEDGE.md` | Clawb's knowledge base about lawb.xyz |
| `test-firebase.js` | Quick connection test |

## Running 24/7

To keep Clawb running after you close the terminal, use pm2:

```bash
npm install -g pm2
pm2 start index.js --name clawb -- --no-pvp
pm2 save
pm2 startup   # follow the instructions to run on boot
```

Monitor:
```bash
pm2 logs clawb
pm2 status
```

## Safety Notes

- **PVP wagers are real money.** Start with `--no-pvp` until you're comfortable.
- The PVP agent has conservative defaults: max 0.001 ETH per game, 1 game at a time, Base chain only.
- Adjust limits in `chess-pvp-agent.js` (the `MAX_WAGER_*` and `MAX_CONCURRENT_GAMES` constants).
- Never commit `.env` or `service-account.json` to git.

## Files that must NEVER be committed

- `.env` (wallet key, API keys)
- `service-account.json` (Firebase admin access)

Both are already in `.gitignore`.
