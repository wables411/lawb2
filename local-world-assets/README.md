# Local World Assets

Drop local-only world models here for Clawb World.

This directory is ignored by git (except this README and `manifest.example.json`) so you can keep heavy assets on this machine without pushing to Netlify.

## Setup

1. Create `manifest.json` in this folder (copy `manifest.example.json`).
2. Put your models under:
   - `public/local-world-assets/models/`
3. Use model URLs in the manifest, for example:
   - `/local-world-assets/models/fish_tuna.glb`
   - `/local-world-assets/models/shipwreck_a.glb`

## Notes

- Preferred model format: `.glb`
- Behaviors currently supported:
  - `swim_circle`
  - `swim_figure8`
  - `bob`
  - `static`
- Assets are loaded only if `manifest.json` exists.
