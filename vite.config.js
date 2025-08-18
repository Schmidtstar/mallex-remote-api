import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        }
    },
    server: {
        host: true,
        port: 5173,
        hmr: {
            protocol: 'wss',
            host: 'localhost', // Use localhost instead of 0.0.0.0
            clientPort: 443,
            port: 5173
        },
        cors: true,
        // Add headers for better CORS support
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
                    i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
                },
                chunkSizeWarningLimit: 1000
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    },
    optimizeDeps: {
        include: ['firebase/app', 'firebase/auth', 'firebase/firestore']
    }
});
