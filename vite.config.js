// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Let Rolldown handle minification natively (no terser/esbuild needed)
    minify: true,
    
    // Target modern browsers
    target: 'esnext',

    // Code splitting configuration
    rollupOptions: {
      output: {
        // CRITICAL FIX: Must be a function for rolldown-vite
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core libraries
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'react-vendor';
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // UI icons
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
          }
        },
      },
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Optimize dependencies for dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
});