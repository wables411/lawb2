# Base Mini App Setup Guide

This document outlines how to deploy lawb.xyz as a **separate Base Mini App** without affecting the existing lawb.xyz web app.

## 🎯 Important: Separate Deployment

The Base Mini App is configured to be a **separate deployment** that:
- Functions and looks identical to lawb.xyz
- Supports Base Mainnet (already configured in wagmi/appkit)
- Is recognized as a registered Base Mini App
- **Does NOT affect** the existing lawb.xyz web app

## ✅ Completed Steps

1. ✅ Installed `@farcaster/miniapp-sdk` package
2. ✅ Created conditional Base Mini App initialization (only activates when `VITE_BASE_MINIAPP=true`)
3. ✅ Created manifest file at `/public/.well-known/farcaster.json`
4. ✅ Created separate `index.base-miniapp.html` with Base Mini App metadata

## 📋 Deployment Options

### Option 1: Separate Domain/Subdomain (Recommended)
Deploy to a separate URL like `base.lawb.xyz` or `miniapp.lawb.xyz`:
- Use `index.base-miniapp.html` as your `index.html`
- Set environment variable `VITE_BASE_MINIAPP=true` during build
- This keeps the deployments completely separate

### Option 2: Same Domain with Environment Variable
Deploy to the same domain but use environment variable:
- Build with `VITE_BASE_MINIAPP=true`
- The SDK will only initialize when this flag is set
- Use `index.base-miniapp.html` as your `index.html` for this deployment

## 📋 Manual Steps Required

### Step 1: Deploy Changes to Production

Make sure all the changes are live on `https://lawb.xyz`:
- The manifest file should be accessible at `https://lawb.xyz/.well-known/farcaster.json`
- The app should be deployed with the SDK integration

### Step 2: Get Your Base Account Address

You need a Base account address to set as the `ownerAddress` in the manifest. This should be your Base wallet address.

### Step 3: Generate Account Association Credentials

1. Navigate to the Base Build [Account association tool](https://www.base.dev/preview?tab=account)
2. Paste your domain (`lawb.xyz`) in the "App URL" field
3. Click "Submit"
4. Click the "Verify" button that appears
5. Follow the instructions to generate the `accountAssociation` fields
6. Copy the generated `header`, `payload`, and `signature` values

### Step 4: Update the Manifest File

Edit `/public/.well-known/farcaster.json` and update:

1. **`baseBuilder.ownerAddress`**: Replace `"0x"` with your Base account address
2. **`accountAssociation`**: Replace the empty strings with the values from Step 3:
   ```json
   "accountAssociation": {
     "header": "your-generated-header-here",
     "payload": "your-generated-payload-here",
     "signature": "your-generated-signature-here"
   }
   ```
3. **`miniapp.webhookUrl`** (optional): If you want to receive webhook events, add your webhook URL

### Step 5: Update Image URLs (if needed)

Review the manifest and ensure all image URLs are correct and accessible:
- `iconUrl`: Should point to a square icon (recommended: 512x512px)
- `splashImageUrl`: Splash screen image
- `heroImageUrl`: Hero/OG image
- `screenshotUrls`: Array of screenshot URLs for the app store
- `ogImageUrl`: Open Graph image

### Step 6: Preview Your App

1. Go to the Base Build [Preview tool](https://www.base.dev/preview)
2. Add your app URL (`https://lawb.xyz`)
3. Verify:
   - **Embeds**: Check that the embed preview looks correct
   - **Launch**: Click the launch button to verify the app launches properly
   - **Account association**: Use the "Account association" tab to verify credentials
   - **Metadata**: Use the "Metadata" tab to see all manifest fields and identify any missing ones

### Step 7: Publish Your App

To publish your app to the Base app:

1. Create a post in the Base app with your app's URL (`https://lawb.xyz`)
2. The app will be available in the Base app ecosystem

## 📝 Notes

- The manifest file must be accessible at `https://lawb.xyz/.well-known/farcaster.json`
- The `accountAssociation` signature will be longer if you sign with your Base Account (vs. Farcaster custody wallet)
- Make sure all image URLs in the manifest are publicly accessible
- The `webhookUrl` is optional but can be useful for receiving events from the Base app

## 🔗 Useful Links

- [Base Build Preview Tool](https://www.base.dev/preview)
- [Base Build Account Association Tool](https://www.base.dev/preview?tab=account)
- [Base Mini Apps Documentation](https://docs.base.org/mini-apps)

