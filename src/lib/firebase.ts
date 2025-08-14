import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Validierung der Firebase-Konfiguration
const isConfigValid = firebaseConfig.apiKey &&
                     firebaseConfig.authDomain &&
                     firebaseConfig.projectId

if (!isConfigValid) {
  throw new Error('🚨 Firebase configuration is incomplete. Please check your environment variables.')
}

// Global declarations für bessere Module-Resolution
declare global {
  interface Window {
    _firebaseConfigLogged?: boolean;
  }
}

// Debug Firebase Config nur einmal loggen
if (import.meta.env.DEV && !window._firebaseConfigLogged) {
  console.log('🔧 Firebase Config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '[HIDDEN]' : '[MISSING]'
  })
  window._firebaseConfigLogged = true
}

// Firebase initialisieren
export const app = initializeApp(firebaseConfig)

// Auth und DB mit expliziter Typisierung
let auth: Auth
let db: Firestore

try {
  auth = getAuth(app)
  db = getFirestore(app)
} catch (error) {
  console.error('🚨 Firebase initialization failed:', error)
  throw error
}

// Emulator nur im Development und falls nicht bereits verbunden
if (import.meta.env.DEV) {
  try {
    // Auth Emulator
    if (!(auth as any)._config?.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
      console.log('🔧 Auth Emulator connected')
    }
  } catch (error) {
    console.log('🟢 Firebase Auth online - production mode')
  }

  try {
    // Firestore Emulator
    if (!(db as any)._delegate?._databaseId?.projectId?.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080)
      console.log('🔧 Firestore Emulator connected')
    }
  } catch (error) {
    console.log('🟢 Firestore online - production mode')
  }
}

// Explizite Exports
export { auth, db }
export { auth as firebaseAuth }
export { db as firestore }
export const firestore = db

// Named exports für bessere Kompatibilität
export const firebase = { auth, db }

console.log('🔥 Firebase ready')