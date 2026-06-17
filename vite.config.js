import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
    server: {
        port: 5173,
        strictPort: true,
    },
    test: {
        globals: true,
    },
    plugins: [
        vue(),
        VitePWA({
            selfDestroying: true,
            manifest: {
                name: 'Petanque Draw',
                short_name: 'Petanque',
                description: 'Program for drawing petanque tournaments: swiss, round & knockout systems',
                theme_color: '#471aa0',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '.',
                icons: [
                    { src: 'img/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'img/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
                    {
                        src: 'img/icons/android-chrome-maskable-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: 'img/icons/android-chrome-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    base: mode === 'production' ? '/petanque-draw/' : '/',
    optimizeDeps: {
        include: ['qrcode.vue', 'vue3-apexcharts', 'apexcharts'],
    },
    build: {
        sourcemap: true,
    },
}));
