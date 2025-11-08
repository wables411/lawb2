# Firebase Mobile Connection Troubleshooting

## Issue
Chat and leaderboard work on desktop but not on mobile - stuck on "checking connection..." or "Loading..."

## Potential Causes

### 1. Firebase Authorized Domains (Most Likely)
Firebase projects have **authorized domains** that must be configured in the Firebase Console. If your domain isn't authorized, Firebase will block connections.

**Check in Firebase Console:**
1. Go to https://console.firebase.google.com
2. Select your project: `chess-220ee`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Ensure these domains are listed:
   - `lawb.xyz`
   - `chess.lawb.xyz` (if chess is on subdomain)
   - `localhost` (for development)

**For Realtime Database specifically:**
- Go to **Realtime Database** → **Rules**
- Check if there are any domain-based restrictions
- The rules should allow read/write (for testing, you can temporarily set to `{ "rules": { ".read": true, ".write": true } }`)

### 2. Network/CORS Issues on Mobile
Mobile networks may have different CORS policies or block Firebase connections.

**Check CSP Headers:**
- The `_headers` file allows `https://*.firebaseio.com` and `wss://*.firebaseio.com`
- This should be sufficient, but verify on mobile

### 3. Firebase App Configuration
The Firebase app might need to be configured for web domains.

**Check Firebase Console:**
1. Go to **Project Settings** → **General**
2. Under **Your apps**, find your web app
3. Check **App ID**: `1:724477138097:web:7dc15f79db3bda5c763e90`
4. Verify the **App check** settings (if enabled)

### 4. Reown vs Firebase
**Reown and Firebase are completely separate:**
- Reown (AppKit) is for wallet connections - uses WebSockets
- Firebase is for database/chat - uses HTTPS/WebSockets
- They don't interfere with each other

**However:**
- If you're accessing from `chess.lawb.xyz` subdomain, make sure it's authorized in Firebase
- The `baseUrl` in `appkit.ts` is `https://lawb.xyz` - this is only for Reown wallet connections

## Quick Fixes to Try

### 1. Add Domain to Firebase Authorized Domains
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add `lawb.xyz` and `chess.lawb.xyz` if not present
3. Save and wait a few minutes for propagation

### 2. Check Firebase Realtime Database Rules
1. Firebase Console → Realtime Database → Rules
2. Temporarily set to:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
3. Test on mobile
4. If it works, then adjust rules to be more restrictive but still allow your domains

### 3. Verify Network Access
- Test on different mobile networks (WiFi vs cellular)
- Check if mobile browser has any restrictions
- Try incognito/private mode on mobile

### 4. Check Browser Console on Mobile
- Use remote debugging (Chrome DevTools → More tools → Remote devices)
- Check for CORS errors or Firebase connection errors
- Look for blocked requests to `*.firebaseio.com`

## Current Configuration

**Firebase Config:**
- Database URL: `https://chess-220ee-default-rtdb.firebaseio.com`
- Project ID: `chess-220ee`
- App ID: `1:724477138097:web:7dc15f79db3bda5c763e90`

**CSP Headers (from `_headers`):**
- Allows: `https://*.firebaseio.com`
- Allows: `wss://*.firebaseio.com`

**Reown Config:**
- Base URL: `https://lawb.xyz` (production)
- This is separate from Firebase

## Next Steps

1. **Check Firebase Console** for authorized domains
2. **Test with permissive Firebase rules** temporarily
3. **Check mobile browser console** for specific errors
4. **Verify domain access** - are you accessing from `lawb.xyz` or `chess.lawb.xyz`?

