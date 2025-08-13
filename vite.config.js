import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: true,
        hmr: {
            timeout: 10000,
            overlay: false
        },
        watch: {
            usePolling: true,
            interval: 1000
        }
    },
    preview: {
        host: '0.0.0.0',
        port: 3000
    },
    build: {
        target: 'es2020',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
                    i18n: ['i18next', 'react-i18next']
                }
            }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild',
        cssMinify: true
    }
});
