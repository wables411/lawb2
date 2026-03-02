# Local World Assets

Drop local-only world models here for Clawb World.

This directory is ignored by git (except this README and `*.example.json`) so you can keep heavy assets on this machine without pushing to Netlify.

## Setup

1. Create `manifest.json` in this folder (copy `manifest.example.json`).
2. Put your models under:
   - `public/local-world-assets/models/`
3. Use model URLs in the manifest, for example:
   - `/local-world-assets/models/fish_tuna.glb`
   - `/local-world-assets/models/shipwreck_a.glb`
4. **Gallery (NFTs in !gallery)**: Create `gallery.json` (copy `gallery.example.json`). Add `image_url` for each NFT (IPFS, OpenSea CDN, etc.). When local, the world loads this instead of Firebase.

## Notes

- Preferred model format: `.glb`
- Behaviors currently supported:
  - `swim_circle`
  - `swim_figure8`
  - `bob`
  - `static`
- Assets are loaded only if `manifest.json` exists.
