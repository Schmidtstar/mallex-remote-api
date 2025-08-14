import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  console.log('[vite] 🚀 Config loaded – mode:', mode)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5000,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: [
        '.replit.dev',         // Wildcard for all Replit subdomains
        '.riker.replit.dev',   // Specific Replit infrastructure
        'localhost'            // Local development
      ],
      hmr: {
        port: 5001,
        host: '0.0.0.0',
        overlay: false,
        timeout: 60000,              // Längerer Timeout für Replit
        clientErrorOverlay: false,
        reconnectionDelay: 1000,     // Delay zwischen Reconnects
        reconnectionAttempts: 5,     // Mehr Versuche für Replit
        skipSSLVerification: true
      },
      watch: {
        usePolling: true,              // Aktiviere Polling für Replit
        interval: 2000,                // Längeres Intervall
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/*.log'
        ]
      },
      cors: true, // CORS für WebSocket-Verbindungen
    },
    preview: {
      host: true,
      port: 5000,
      allowedHosts: [
        '.replit.dev',
        '.riker.replit.dev'
      ]
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      target: 'es2015', // Better mobile compatibility
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
    }
  }
})