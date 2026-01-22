import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// Determine base path based on environment
// - Development (serve): '/'
// - Production: '/app/'
// - Staging: '/app-staging/'
function getBasePath(command) {
    if (command === 'serve') return '/';
    if (process.env.DEPLOY_TARGET === 'staging') return '/app-staging/';
    return '/app/';
}

export default defineConfig(({ command }) => {
    const base = getBasePath(command);

    // Determine deployment target for feature flags
    // - Development (serve): 'development'
    // - Staging: 'staging'
    // - Production: 'production'
    const deployTarget = command === 'serve'
        ? 'development'
        : (process.env.DEPLOY_TARGET || 'production');

    return {
    base,
    root: '.',

    // Inject deployment target for runtime feature flag checks
    define: {
        'import.meta.env.VITE_DEPLOY_TARGET': JSON.stringify(deployTarget)
    },

    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/*.png'],

            manifest: {
                name: 'Saberloop - Learn Anything, Practice Anything',
                short_name: 'Saberloop',
                id: base,
                description: 'The fun way to learn and track your progress with AI-powered quizzes',
                theme_color: '#FF6B35',
                background_color: '#1a1a2e',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: base,
                start_url: base,
                icons: [
                    {
                        src: `${base}icons/icon-192x192.png`,
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: `${base}icons/icon-512x512.png`,
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: `${base}icons/icon-192x192-maskable.png`,
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: `${base}icons/icon-512x512-maskable.png`,
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                screenshots: [
                    {
                        src: `${base}icons/screenshot-mobile-1.png`,
                        sizes: '400x855',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'Saberloop Welcome Screen'
                    },
                    {
                        src: `${base}icons/screenshot-mobile-2.png`,
                        sizes: '400x855',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'Saberloop Home Screen'
                    },
                    {
                        src: `${base}icons/screenshot-desktop-1.png`,
                        sizes: '1280x720',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: 'Saberloop on Desktop'
                    }
                ],
                categories: ['education', 'learning', 'quiz']
            },

            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],

                runtimeCaching: [

                    // Tailwind CDN (Cache First)
                    {
                        urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'tailwind-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    // Images (Cache First)
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    }
                ],

                cleanupOutdatedCaches: true,
                navigateFallback: `${base}index.html`,
                navigateFallbackDenylist: [/^\/api/]
            },

            devOptions: {
                enabled: true,
                type: 'module',
                suppressWarnings: true
            }
        }),
        visualizer({
            filename: 'reports/bundle-stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
        })
    ],

    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    },

    server: {
        port: 8888,
        open: false,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    }
};
});