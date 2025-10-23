import { defineConfig } from 'vite';

export default defineConfig({
    // Root directory (where index.html is)
    root: '.',

    // Build configuration
    build: {
        // Output directory for production build
        outDir: 'dist',

        // Don't empty outDir before building (safer)
        emptyOutDir: true,

        // Generate source maps for debugging
        sourcemap: true,

        // Copy service worker and manifest to dist
        rollupOptions: {
        input: {
            main: './index.html'
        }
        }
    },

    // Development server configuration
    server: {
        port: 3000,
        open: true
    }
});