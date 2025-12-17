# Deploy Base Mini App

This guide explains how to build and deploy lawb.xyz as a Base Mini App **without affecting the existing lawb.xyz web app**.

## 🎯 Key Points

- **lawb.xyz remains unchanged** - all existing functionality stays the same
- Base Mini App is a **separate deployment** with identical functionality
- Base Mainnet is already configured in the app (no code changes needed)
- The SDK only initializes when `VITE_BASE_MINIAPP=true` is set

## 📦 Build for Base Mini App

### Option 1: Build with Environment Variable

```bash
# Set the environment variable and build
VITE_BASE_MINIAPP=true npm run build

# Copy the Base Mini App HTML file
cp index.base-miniapp.html dist/index.html

# Deploy the dist/ folder to your Base Mini App URL
```

### Option 2: Create a Build Script

Add to `package.json`:

```json
{
  "scripts": {
    "build:base-miniapp": "VITE_BASE_MINIAPP=true npm run build && cp index.base-miniapp.html dist/index.html"
  }
}
```

Then run:
```bash
npm run build:base-miniapp
```

## 🌐 Deployment

### Recommended: Separate Subdomain

Deploy to a separate URL like:
- `base.lawb.xyz`
- `miniapp.lawb.xyz` 
- `app.lawb.xyz`

This keeps the deployments completely separate.

### Deployment Steps

1. **Build the Base Mini App version:**
   ```bash
   VITE_BASE_MINIAPP=true npm run build
   cp index.base-miniapp.html dist/index.html
   ```

2. **Deploy `dist/` folder** to your Base Mini App domain/subdomain

3. **Verify the manifest is accessible:**
   - Should be at: `https://your-base-miniapp-domain/.well-known/farcaster.json`

4. **Complete the Base Mini App registration:**
   - Follow steps in `BASE_APP_SETUP.md` to:
     - Get your Base account address
     - Generate account association credentials
     - Update the manifest file
     - Preview and publish

## ✅ What's Already Configured

- ✅ Base Mainnet support (in `wagmi.ts` and `appkit.ts`)
- ✅ Conditional SDK initialization (only when `VITE_BASE_MINIAPP=true`)
- ✅ Manifest file structure (`/public/.well-known/farcaster.json`)
- ✅ Base Mini App HTML template (`index.base-miniapp.html`)

## 🔍 Verification

After deployment, verify:
1. The app functions identically to lawb.xyz
2. Base Mainnet is available in wallet connections
3. The manifest is accessible at `/.well-known/farcaster.json`
4. The SDK initializes (check console for `[Base Mini App] SDK initialized`)

## 📝 Notes

- The existing `lawb.xyz` deployment is **completely unaffected**
- Both deployments can run simultaneously
- The Base Mini App version will have the Base Mini App SDK active
- All other functionality (chess, memes, NFTs, etc.) works identically















