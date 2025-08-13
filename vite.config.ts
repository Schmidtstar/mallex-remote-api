
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
      host: true,              // Allow external hosts
      port: 3000,              // Your current port
      strictPort: false,       // Auto-increment if port busy
      allowedHosts: [
        '.replit.dev',         // Wildcard for all Replit subdomains
        '.riker.replit.dev',   // Specific Replit infrastructure
        'localhost'            // Local development
      ],
      hmr: {
        protocol: 'wss',       // WebSocket Secure for HTTPS
        clientPort: 443        // Standard HTTPS port
      }
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
