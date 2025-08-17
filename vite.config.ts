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
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: [
        '.replit.dev',
        '.riker.replit.dev',
        'localhost'
      ],
      hmr: process.env.REPL_SLUG && process.env.REPL_OWNER
        ? {
            protocol: 'wss',
            host: `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`,
            port: 443,
            clientPort: 443,
            overlay: false
          }
        : process.env.NODE_ENV === 'development'
        ? {
            port: 5173,
            host: '0.0.0.0',
            overlay: false
          }
        : false,
      watch: {
        usePolling: false,
        interval: 1000,
        ignored: ['**/node_modules/**', '**/.git/**']
      },
      cors: true
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
      sourcemap: true,
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
      include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
      exclude: ['@firebase/auth', '@firebase/firestore']
    }
  }
})