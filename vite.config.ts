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
        host: '0.0.0.0',           // Wichtig für Replit WebSocket-Zugriff
        overlay: false,
        timeout: 30000,            // Reduzierter Timeout
        clientErrorOverlay: false,
        reconnectionAttempts: 2,   // Weniger Reconnect-Versuche
        skipSSLVerification: true, // Für Replit SSL-Probleme
      },
      watch: {
        usePolling: false,
        interval: 1000,
        ignored: ['**/node_modules/**', '**/.git/**'], // Weniger File-Watching
      },
      cors: true, // CORS für WebSocket-Verbindungen
    },
    preview: {
      host: true,
      port: 3000,
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