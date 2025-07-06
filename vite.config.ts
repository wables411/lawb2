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
        target: 'http://107.170.71.63:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stockfish/, '/api/stockfish')
      }
    }
  }
});