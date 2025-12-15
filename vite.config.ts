import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
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
  // Use resolve.alias to stub out AppKit modules when detected in Base app context
  // This prevents them from being bundled at all
  resolve: {
    alias: {
      // Note: We can't conditionally alias at build time, so we'll handle this at runtime
      // The dynamic imports with proper guards should prevent loading
    },
  },
});