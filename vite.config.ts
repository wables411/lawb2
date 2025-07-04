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
        target: process.env.NODE_ENV === 'production' 
          ? 'https://lawb-chess-api.wablesphoto.workers.dev'
          : 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stockfish/, '')
      }
    }
  }
});