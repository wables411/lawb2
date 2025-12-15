import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        // Keep console.log statements that start with [AppKit], [CREATE], [PIECE SET], [Base Mini App]
        // This allows us to debug issues in production
        drop_console: false, // Keep console logs for debugging Base app issues
        drop_debugger: true,
        // Alternative: Use pure_funcs to remove specific console methods while keeping others
        // pure_funcs: ['console.info', 'console.debug'], // Remove info/debug but keep log/warn/error
      },
    },
    // Split chunks for better caching and loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'wagmi-vendor': ['wagmi', 'viem'],
          'chess-vendor': ['react-draggable'],
          // Separate large UI libraries
          'ui-vendor': ['react-jss', 'react-router-dom'],
        },
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      // Exclude WalletConnect/AppKit modules from bundle when possible
      // This helps prevent them from being included even in dynamic imports
      external: (id) => {
        // Don't externalize - we need them bundled, just not loaded in Base app
        // Instead, we'll use resolve.alias to stub them out conditionally
        return false;
      },
    },
    // Increase chunk size warning limit to avoid false warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (optional, can be disabled for smaller bundles)
    sourcemap: false,
  },
  // Optimize dependencies - EXCLUDE WalletConnect/AppKit to prevent pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wagmi',
      'viem',
      'react-router-dom',
    ],
    // Explicitly exclude WalletConnect/AppKit from pre-bundling
    exclude: [
      '@reown/appkit',
      '@reown/appkit/react',
      '@reown/appkit/networks',
      '@reown/appkit-adapter-wagmi',
      '@walletconnect/core',
      '@walletconnect/universal-provider',
    ],
  },
  // Note: We can't use resolve.alias to conditionally stub modules at build time
  // Instead, we rely on runtime checks and dynamic imports to prevent loading in Base app
  // The optimizeDeps.exclude above prevents pre-bundling, which helps
  resolve: {
    // No aliases - we handle exclusion at runtime via dynamic imports
  },
});