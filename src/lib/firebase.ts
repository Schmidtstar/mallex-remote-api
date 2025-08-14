
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth'
import {
  initializeFirestore,
  enableNetwork,
  persistentLocalCache
} from 'firebase/firestore'

declare global {
  interface Window {
    _firebaseConfigLogged?: boolean
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Validate configuration in production
if (import.meta.env.PROD) {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ]
  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`)
    }
  }
}

// Initialize Firebase app once
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Initialize Firestore with proper cache configuration
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 40 * 1024 * 1024 // 40MB
  })
})

// Enable network
enableNetwork(db)

// Initialize Auth with persistence
const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence)

export { app, auth, db }
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true,
  // ✅ KORREKT: Funktion statt Objekt, cacheSizeBytes statt sizeBytes
  localCache: persistentLocalCache({ cacheSizeBytes: 40_000_000 })
})

// Auth-Persistenz
const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn('Auth persistence warning:', e?.message || e)
)

// Netzwerk aktivieren + Retry-Logik
if (typeof window !== 'undefined') {
  enableNetwork(db).catch(console.warn)

  let connectionAttempts = 0
  const maxRetries = 3

  const ensureConnection = async () => {
    try {
      await enableNetwork(db)
      connectionAttempts = 0
    } catch {
      if (connectionAttempts < maxRetries) {
        connectionAttempts++
        const delay = Math.pow(2, connectionAttempts) * 1000
        setTimeout(ensureConnection, delay)
      }
    }
  }

  window.addEventListener('online', ensureConnection)
}

// Dev-Indicator
if (import.meta.env.DEV && !window._firebaseConfigLogged) {
  console.log('🔥 Firebase ready')
  window._firebaseConfigLogged = true
}

export { auth, db }
