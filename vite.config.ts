import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      '/api/stockfish': {
        target: 'https://stellular-palmier-549883.netlify.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stockfish/, '/.netlify/functions/stockfish')
      }
    }
  }
});