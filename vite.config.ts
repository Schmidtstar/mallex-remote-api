import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development'
  
  return {
  plugins: [
    react({
      include: "**/*.{jsx,tsx}",
      babel: {
        presets: [
          ['@babel/preset-react', { 
            runtime: 'automatic',
            development: isDev
          }]
        ],
        plugins: []
      },
      fastRefresh: isDev
    })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@features': resolve(__dirname, './src/features'),
      '@lib': resolve(__dirname, './src/lib'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@styles': resolve(__dirname, './src/styles'),
      '@config': resolve(__dirname, './src/config'),
      '@context': resolve(__dirname, './src/context'),
      '@i18n': resolve(__dirname, './src/i18n')
    },
    // Performance: Reduziere Auflösungszeit
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    open: false, // Nicht automatisch öffnen in Replit

    // Optimierte Replit-Hosts
    allowedHosts: [
      '.replit.dev',
      '.repl.co',
      '.riker.replit.dev',
      '.replit.com',
      'localhost'
    ],

    // HMR Optimierung für Replit
    hmr: {
      port: 5173,
      host: '0.0.0.0',
      clientPort: 443, // HTTPS in Replit
      overlay: {
        warnings: false,
        errors: true
      }
    },

    // CORS Optimierung
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },

    // Cache-Optimierung
    middlewareMode: false,
    fs: {
      strict: false, // Erlaubt Zugriff auf externe Dateien
      allow: ['..'] // Sicherheit für Replit
    }
  },

  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',

    // Asset-Optimierung
    assetsDir: 'assets',
    assetsInlineLimit: 4096, // 4KB inline limit

    // Rollup-Optimierung
    rollupOptions: {
      output: {
        // Chunk-Splitting für bessere Cache-Strategie
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],

          // Router
          'router': ['react-router-dom'],

          // Firebase Bundle
          'firebase': [
            'firebase/app', 
            'firebase/auth', 
            'firebase/firestore',
            'firebase/analytics'
          ],

          // Internationalization
          'i18n': [
            'i18next', 
            'react-i18next', 
            'i18next-browser-languagedetector'
          ],

          // Capacitor für Mobile
          'capacitor': [
            '@capacitor/core',
            '@capacitor/device',
            '@capacitor/haptics',
            '@capacitor/push-notifications',
            '@capacitor/share',
            '@capacitor/splash-screen',
            '@capacitor/status-bar'
          ],

          // Virtualization
          'virtualization': [
            'react-window',
            'react-window-infinite-loader'
          ]
        },

        // Dateinamen-Optimierung
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]

          if (/\.(css|scss|sass|less|styl)$/.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash].[ext]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash].[ext]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash].[ext]'
          }

          return `assets/${extType}/[name]-[hash].[ext]`
        },

        chunkSizeWarningLimit: 1000
      },

      // Externe Dependencies
      external: (id) => {
        // Capacitor als external für Web-Build
        return id.includes('@capacitor/') && process.env.NODE_ENV === 'production'
      }
    },

    // Minification mit Terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2 // Mehrere Optimierungsdurchläufe
      },
      mangle: {
        safari10: true // Safari 10 Kompatibilität
      },
      format: {
        comments: false // Keine Kommentare in Produktion
      }
    },

    // CSS Code Splitting
    cssCodeSplit: true,

    // Optimierte CSS-Minification
    cssMinify: 'lightningcss',

    // Report komprimierte Größe
    reportCompressedSize: true,

    // Chunk-Größen-Limit
    chunkSizeWarningLimit: 500
  },

  // Dependency Pre-bundling Optimierung
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/analytics',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
      'react-window',
      'react-window-infinite-loader'
    ],
    exclude: [
      // Capacitor Plugins für Web ausschließen
      '@capacitor/device',
      '@capacitor/haptics',
      '@capacitor/push-notifications',
      '@capacitor/share',
      '@capacitor/splash-screen',
      '@capacitor/status-bar'
    ],
    // Force include für problematische Dependencies
    force: true
  },

  // CSS Preprocessing
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/tokens.css";`
      }
    },
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: isDev 
        ? '[name]__[local]___[hash:base64:5]'
        : '[hash:base64:8]'
    }
  },

  // Experimental Features
  experimental: {
    hmrPartialAccept: true
  },

  // Environment Variables
  define: {
    __DEV__: isDev,
    __PROD__: !isDev,
    'process.env.NODE_ENV': JSON.stringify(mode)
  },

  // Worker-Optimierung
  worker: {
    format: 'es',
    plugins: [react()]
  },

  // JSON-Optimierung
  json: {
    namedExports: true,
    stringify: false
  }
}})