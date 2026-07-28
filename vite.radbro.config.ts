import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * RADBRO REEF RUN — standalone radbro.fun build.
 *
 * Builds `standalone-radbro/index.html` (radbro-only, wallet-free shell over the same arcade
 * engine) into `dist-radbro/` with RELATIVE paths, so the whole folder can be zipped and served
 * from any static path (radbro.fun hosts uploads on blob storage inside a sandboxed iframe).
 * Assets are copied separately by `scripts/build-radbro-zip.mjs` (radbro FBX + light GLBs only).
 *
 * Build: npm run build:radbro   (vite build --config vite.radbro.config.ts + asset copy + zip)
 */
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'standalone-radbro'),
  // Relative base = works from any hosted subpath.
  base: './',
  // Do NOT pull in the site's public/ (Netlify headers, other pages' media).
  publicDir: false,
  define: {
    // The engine resolves FBX/GLB urls from this base — relative for the ZIP.
    'import.meta.env.VITE_ARCADE_ASSET_BASE': JSON.stringify('arcade-assets'),
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-radbro'),
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 3400,
  },
});
