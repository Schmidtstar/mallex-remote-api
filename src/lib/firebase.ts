import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration in production
if (import.meta.env.PROD) {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ]

  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`)
    }
  }
}

// Initialize Firebase app once
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Synchrone Initialisierung für bessere Performance
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { initializeFirestore, enableNetwork, connectFirestoreEmulator } from 'firebase/firestore'

// Initialize Firebase services synchronously
const auth = getAuth(app)
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true,
  localCache: {
    kind: 'persistent',
    tabManager: 'optimistic',
    sizeBytes: 40000000
  }
})

// Setup auth persistence
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn('Auth persistence warning:', e?.message || e)
)

// Enable network for Firestore
if (typeof window !== 'undefined') {
  enableNetwork(db).catch(console.warn)
}

// Connection retry logic
let connectionAttempts = 0
const maxRetries = 3

const ensureConnection = async () => {
  try {
    await enableNetwork(db)
    connectionAttempts = 0
  } catch (error) {
    if (connectionAttempts < maxRetries) {
      connectionAttempts++
      const delay = Math.pow(2, connectionAttempts) * 1000
      setTimeout(ensureConnection, delay)
    }
  }
}

// Auto-retry connection on network issues
if (typeof window !== 'undefined') {
  window.addEventListener('online', ensureConnection)
}

export { auth, db }

// Firebase ready indicator - development only
if (import.meta.env.DEV && !window._firebaseConfigLogged) {
  console.log('🔥 Firebase ready')
  window._firebaseConfigLogged = true
}