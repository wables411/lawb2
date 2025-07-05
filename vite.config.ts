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
        target: 'https://5721e1ad.lawb2.pages.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stockfish/, '/api/stockfish')
      }
    }
  }
});