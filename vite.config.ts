
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: [
      '.replit.dev',
      '.repl.co',
      '.riker.replit.dev',
      'localhost'
    ],
    hmr: {
      port: 5173,
      host: '0.0.0.0',
      clientPort: 443,
      overlay: false
    },
    cors: {
      origin: true,
      credentials: true
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
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
})
