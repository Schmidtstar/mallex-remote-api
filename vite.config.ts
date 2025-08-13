
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    hmr: { clientPort: 443 },
    allowedHosts: true
  },
  preview: { 
    host: true, 
    port: Number(process.env.PORT) || 4173,
    strictPort: false 
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
