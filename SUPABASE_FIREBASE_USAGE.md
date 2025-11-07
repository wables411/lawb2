# Supabase vs Firebase Usage Documentation

## Overview

This document clarifies the current state of Supabase and Firebase usage in the lawb2 repository, addressing security concerns and migration status.

## Current State Summary

### Frontend (src/ directory)
**Status**: ✅ **Fully migrated to Firebase**

The frontend application uses **Firebase Realtime Database** exclusively for:
- Chess game state management
- Real-time game synchronization
- Leaderboard data
- Chat functionality

**Key Files:**
- `src/firebaseApp.ts` - Firebase initialization
- `src/firebaseChess.ts` - Chess game operations (Firebase)
- `src/firebaseLeaderboard.ts` - Leaderboard operations (Firebase)
- `src/firebaseChat.ts` - Chat operations (Firebase)

**No Supabase usage in frontend code** - All Supabase references in `src/utils/gameResolver.ts` are commented out.

### Backend Services
**Status**: ⚠️ **Still uses Supabase**

The backend WebSocket server (`simple-websocket-server.js`) still uses Supabase for:
- Database updates when game state changes
- Watching database changes for real-time updates

**Files:**
- `simple-websocket-server.js` - WebSocket server using Supabase
- `resolve-stuck-game.js` - Utility script using Supabase (now requires env vars)

**Deployment Configuration:**
- `railway.json` - Configures Railway to run `simple-websocket-server.js`
- `render.yaml` - Configures Render to run `simple-websocket-server.js`
- `package.json` - Has `start` script: `node simple-websocket-server.js`

**Note**: The frontend does NOT appear to use this WebSocket server - it uses Firebase real-time directly via `firebaseChess.subscribeToGame()`.

## Security Issues Resolved

### ✅ Fixed Issues

1. **Removed leaked Supabase keys from test files:**
   - Deleted `websocket-test.html` (contained hardcoded Supabase URL and anon key)
   - Deleted `test-websocket.html` (contained hardcoded Supabase URL and anon key)
   - Added pattern to `.gitignore` to prevent future commits of test files with sensitive data

2. **Removed hardcoded Supabase URL:**
   - Updated `resolve-stuck-game.js` to require environment variables
   - Removed fallback hardcoded URL: `'https://lahldngklxwirmtbnjyk.supabase.co'`
   - Now requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars

### ⚠️ Remaining Considerations

1. **Backend WebSocket Server:**
   - `simple-websocket-server.js` still uses Supabase
   - May be obsolete if frontend uses Firebase directly
   - **Action needed**: Verify if this server is still in use or can be removed

2. **Environment Variables:**
   - Backend services require Supabase credentials via env vars
   - Ensure these are not committed to repository
   - Already in `.gitignore` (`.env` files)

## Migration Status

### Completed ✅
- Frontend chess game operations → Firebase
- Frontend leaderboard → Firebase
- Frontend chat → Firebase
- Frontend real-time subscriptions → Firebase

### Pending ⚠️
- Backend WebSocket server → Still uses Supabase
- Utility scripts → Still use Supabase (but require env vars now)

## File Reference

### Firebase Files (Active)
| File | Purpose |
|------|---------|
| `src/firebaseApp.ts` | Firebase app initialization |
| `src/firebaseChess.ts` | Chess game operations |
| `src/firebaseLeaderboard.ts` | Leaderboard operations |
| `src/firebaseChat.ts` | Chat operations |

### Supabase Files (Backend/Utility Only)
| File | Purpose | Status |
|------|---------|--------|
| `simple-websocket-server.js` | WebSocket server | ⚠️ Still uses Supabase, may be obsolete |
| `resolve-stuck-game.js` | Game resolution utility | ✅ Now requires env vars (no hardcoded keys) |
| `firebase-migration.js` | Migration script | 📝 Historical (migration completed) |

### Obsolete Supabase Files
These files are likely no longer needed since frontend uses Firebase:
- `fix-supabase-permissions.sql`
- `fix-rls-performance.sql`
- `enable_realtime.sql`
- `DEPLOYMENT.md` (references Supabase deployment)

## Recommendations

### Immediate Actions
1. ✅ **Completed**: Removed leaked keys from test files
2. ✅ **Completed**: Removed hardcoded Supabase URL from `resolve-stuck-game.js`
3. ⚠️ **Recommended**: Verify if `simple-websocket-server.js` is still needed
   - Check if frontend connects to this WebSocket server
   - If not used, consider removing or migrating to Firebase

### Future Considerations
1. **Backend Migration**: If WebSocket server is needed, consider migrating it to use Firebase instead of Supabase
2. **Cleanup**: Remove obsolete Supabase SQL files if no longer needed
3. **Documentation**: Update `DEPLOYMENT.md` to reflect current Firebase-based architecture

## Environment Variables

### Required for Backend Services
```bash
# For simple-websocket-server.js
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8080

# For resolve-stuck-game.js
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Required for Frontend
```bash
# Firebase configuration (in src/firebaseApp.ts)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Security Notes

1. **Never commit** environment variables or API keys to the repository
2. **Test files** with hardcoded keys have been removed
3. **All sensitive data** should use environment variables
4. **`.gitignore`** includes patterns to prevent committing test files with sensitive data

## Conclusion

- **Frontend**: Fully migrated to Firebase ✅
- **Backend**: Still uses Supabase (may be obsolete) ⚠️
- **Security**: Leaked keys removed, hardcoded URLs removed ✅
- **Action Needed**: Verify backend WebSocket server usage

