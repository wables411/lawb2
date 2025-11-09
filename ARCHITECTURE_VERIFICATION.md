# Architecture Verification for lawb.xyz/chess

## Current Architecture Overview

### 1. Frontend (Netlify)
- **Hosting**: Netlify (deploys from GitHub `wables411/lawb2`)
- **Domain**: `lawb.xyz` (main domain)
- **Build**: Vite + React + TypeScript
- **Build Output**: `dist/` directory
- **Configuration**: `netlify.toml`

### 2. Firebase (Database & Real-time)
- **Service**: Firebase Realtime Database
- **Project ID**: `chess-220ee`
- **Database URL**: `https://chess-220ee-default-rtdb.firebaseio.com`
- **Usage**: 
  - Chess game state
  - Leaderboard
  - Chat messages
- **Configuration**: `src/firebaseApp.ts` (hardcoded config with env var fallbacks)

### 3. Stockfish API (DigitalOcean)
- **Hosting**: DigitalOcean Droplet
- **Domain**: `chess.lawb.xyz` (subdomain)
- **IP**: `107.170.71.63` (from previous conversation)
- **Technology**: Node.js + Docker + Nginx
- **Endpoint**: `https://chess.lawb.xyz/api/stockfish`
- **Files**: 
  - `simple-stockfish-api.js` (main server)
  - `Dockerfile.chess-api` (Docker config)
  - `docker-compose.chess-api.yml` (Docker Compose)

### 4. Netlify Functions
- **Location**: `functions/` directory
- **Current Functions**:
  - `game-monitor-simple.js` (game monitoring)
  - `stockfish.js` (placeholder, not used)

## Potential Issues Found

### ⚠️ Issue 1: Conflicting Netlify Redirect
**File**: `netlify.toml` line 9-11
```toml
[[redirects]]
  from = "/api/stockfish"
  to = "/.netlify/functions/stockfish"
  status = 200
```

**Problem**: 
- This redirect sends `/api/stockfish` requests to Netlify functions
- But the code calls `https://chess.lawb.xyz/api/stockfish` (different domain)
- This redirect is **unused** and potentially confusing

**Impact**: Low (different domain, so redirect doesn't apply)
**Recommendation**: Remove or comment out this redirect since Stockfish API is on DigitalOcean

### ⚠️ Issue 2: Firebase Configuration
**File**: `src/firebaseApp.ts`
- Uses hardcoded Firebase config with env var fallbacks
- No `.env` file found (correctly in `.gitignore`)
- **Question**: Are Firebase environment variables set in Netlify?

**Verification Needed**:
- Check Netlify dashboard → Site settings → Environment variables
- Should have: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.

### ⚠️ Issue 3: Stockfish API Endpoint
**File**: `src/components/ChessGame.tsx` line 198
```typescript
const apiUrl = 'https://chess.lawb.xyz/api/stockfish';
```

**Verification Needed**:
1. Is `chess.lawb.xyz` DNS pointing to DigitalOcean droplet (`107.170.71.63`)?
2. Is Docker container running on droplet?
3. Is Nginx configured and serving SSL?
4. Can we reach `https://chess.lawb.xyz/api/stockfish`?

### ⚠️ Issue 4: Netlify Function for Stockfish
**File**: `functions/stockfish.js`
- This is a placeholder that returns `null`
- Not actually used (code calls DigitalOcean API)
- **Recommendation**: Remove or document as unused

## Intended Architecture

### Frontend Flow:
1. User visits `lawb.xyz/chess`
2. Netlify serves React app
3. App connects to Firebase for game state/chat/leaderboard
4. Hard mode calls `chess.lawb.xyz/api/stockfish` for AI moves
5. Easy mode uses local minimax (no API needed)

### Backend Services:
1. **Firebase**: Real-time database (game state, chat, leaderboard)
2. **DigitalOcean**: Stockfish API server (hard mode AI)
3. **Netlify Functions**: Game monitoring (optional)

## Verification Checklist

### GitHub Repository
- [x] Repository exists: `wables411/lawb2`
- [x] Main branch: `main`
- [x] Netlify connected to GitHub for auto-deploy

### Netlify Configuration
- [ ] Site name/ID verified
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Environment variables set (Firebase config)
- [ ] Custom domain: `lawb.xyz` configured
- [ ] SSL certificate active

### Firebase Configuration
- [ ] Project: `chess-220ee` exists
- [ ] Database: Realtime Database enabled
- [ ] Authorized domains: `lawb.xyz` added
- [ ] Database rules configured
- [ ] Environment variables in Netlify match Firebase config

### DigitalOcean Configuration
- [ ] Droplet exists at IP `107.170.71.63`
- [ ] Docker installed and running
- [ ] Stockfish API container running
- [ ] Nginx configured for `chess.lawb.xyz`
- [ ] SSL certificate (Let's Encrypt) active
- [ ] DNS A record: `chess.lawb.xyz` → `107.170.71.63`

### DNS Configuration
- [ ] `lawb.xyz` → Netlify (CNAME or A record)
- [ ] `chess.lawb.xyz` → DigitalOcean droplet IP (A record)

## Testing Checklist

### Frontend (lawb.xyz/chess)
- [ ] Page loads
- [ ] Firebase connects (check console for `[FIREBASE]` logs)
- [ ] Leaderboard loads
- [ ] Chat works
- [ ] Easy mode works (local AI)
- [ ] Hard mode works (calls `chess.lawb.xyz/api/stockfish`)

### Stockfish API (chess.lawb.xyz)
```bash
# Health check
curl https://chess.lawb.xyz/api/stockfish

# Test move calculation
curl -X POST https://chess.lawb.xyz/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

## Recommendations

1. **Remove unused Netlify redirect** for `/api/stockfish` (line 9-11 in `netlify.toml`)
2. **Verify Firebase env vars** are set in Netlify dashboard
3. **Test DigitalOcean API** is accessible and responding
4. **Document** which services are actually used vs. placeholder code
5. **Clean up** unused Netlify function `functions/stockfish.js` or document it

## Questions to Answer

1. Is `chess.lawb.xyz` currently resolving to the DigitalOcean droplet?
2. Is the Stockfish API container running and healthy?
3. Are Firebase environment variables set in Netlify?
4. Is the Netlify site properly connected to GitHub?
5. Are there any other services/configurations not documented here?

