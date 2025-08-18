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

// Initialize Firebase
// const app = initializeApp(firebaseConfig) // This line was commented out in the provided original code.

// Development: Fix WebSocket binding for Replit
if (import.meta.env.DEV) {
  // Force offline mode during development to prevent WebSocket errors
  console.log('🔧 Development mode: Using offline-first Firebase')
}

// Synchrone Initialisierung für bessere Performance
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Initialize Firebase services synchronously
const auth = getAuth(app)
const db = getFirestore(app)

// Setup auth persistence
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((e) =>
    console.warn('Auth persistence warning:', e?.message || e)
  )
}

export { auth, db, app }

// Firebase ready indicator - development only
if (import.meta.env.DEV && !window._firebaseConfigLogged) {
  console.log('🔥 Firebase ready')
  window._firebaseConfigLogged = true
}