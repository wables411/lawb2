# Firebase Rules Update for Multi-Chain Support

## ⚠️ Optional but Recommended

The app will work without this update, but adding validation ensures data integrity.

## 📝 What Changed

Added validation for the `chain` field in `chess_games` to ensure it's either `'sanko'`, `'base'`, or `'arbitrum'`.

## 🔧 The Change

**OLD (line 7):**
```json
".validate": "newData.hasChildren(['invite_code', 'game_state']) && newData.child('invite_code').isString() && newData.child('game_state').isString() && (newData.child('game_state').val() === 'waiting' || newData.child('game_state').val() === 'waiting_for_join' || newData.child('game_state').val() === 'active' || newData.child('game_state').val() === 'finished')"
```

**NEW (line 7):**
```json
".validate": "newData.hasChildren(['invite_code', 'game_state']) && newData.child('invite_code').isString() && newData.child('game_state').isString() && (newData.child('game_state').val() === 'waiting' || newData.child('game_state').val() === 'waiting_for_join' || newData.child('game_state').val() === 'active' || newData.child('game_state').val() === 'finished') && (!newData.hasChild('chain') || (newData.child('chain').isString() && (newData.child('chain').val() === 'sanko' || newData.child('chain').val() === 'base' || newData.child('chain').val() === 'arbitrum')))"
```

## 📋 What This Does

- **If `chain` field exists**: Must be 'sanko', 'base', or 'arbitrum'
- **If `chain` field doesn't exist**: Still valid (backward compatible with old games)
- **Prevents invalid chain values**: Blocks typos or malicious data

## 🚀 How to Deploy

### Option 1: Using Firebase CLI
```bash
# Make sure you're in the lawb2 repo
cd /Users/wables/lawb2

# Deploy just the rules
firebase deploy --only database:rules
```

### Option 2: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`chess-220ee`)
3. Go to Realtime Database → Rules
4. Copy the updated rules from `firebase.rules` file
5. Paste and click "Publish"

## ✅ Verification

After deploying, test by creating a game on Base. The `chain` field should be validated.

## ⚠️ Important Notes

- **Backward Compatible**: Old games without `chain` field will still work
- **Non-Breaking**: If you don't deploy this, the app still works
- **Recommended**: Adds data validation to prevent errors

## 🎯 Decision

**You can:**
- ✅ Deploy now (recommended for data integrity)
- ⏸️ Deploy later (app works fine without it)
- ❌ Skip entirely (not required, but less safe)
