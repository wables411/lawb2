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
      // Force-bundle dayjs (and the sub-paths @reown/appkit + @walletconnect/* import)
      // even though those importers are excluded below — otherwise Vite serves the
      // UMD/CJS dayjs files untransformed and their missing `default` export blanks
      // the whole dev page.
      'dayjs',
      'dayjs/locale/en',
      'dayjs/plugin/relativeTime',
      'dayjs/plugin/updateLocale',
    ],
    // NOTE: optimizeDeps only affects the dev server (esbuild pre-bundling); it has
    // no effect on the production build (Rollup). We previously excluded
    // WalletConnect/AppKit here, but because Vite does NOT rewrite an excluded
    // package's own imports to optimized deps, AppKit's `import 'dayjs/locale/en'`
    // (a UMD/CJS file with no `default` export) was served untransformed and blanked
    // the entire dev page. Letting these be pre-bundled fixes dev; the Base Mini App
    // runtime exclusion is handled separately via dynamic imports + runtime checks.
    exclude: [],
  },
  // Note: We can't use resolve.alias to conditionally stub modules at build time
  // Instead, we rely on runtime checks and dynamic imports to prevent loading in Base app
  // The optimizeDeps.exclude above prevents pre-bundling, which helps
  resolve: {
    // No aliases - we handle exclusion at runtime via dynamic imports
  },
});