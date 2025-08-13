
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    strictPort: false,
    hmr: { 
      clientPort: 443,
      timeout: 60000
    },
    allowedHosts: true,
    cors: true
  },
  preview: { 
    host: '0.0.0.0', 
    port: 4173 
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          i18n: ['i18next', 'react-i18next']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
