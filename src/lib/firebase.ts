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

// Robuste Firebase-Services Initialisierung
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

let auth: any = null;
let db: any = null;

try {
  // Firebase Services mit Fehlerbehandlung
  auth = getAuth(app);
  db = getFirestore(app);

  // Auth Persistence nur im Browser
  if (typeof window !== 'undefined' && auth) {
    setPersistence(auth, browserLocalPersistence).catch((e) => {
      console.warn('Auth persistence skipped:', e?.code || 'unknown');
    });
  }

  console.log('🔥 Firebase services initialized');
} catch (error) {
  console.warn('🟡 Firebase services failed - Offline mode:', error);
  // Graceful degradation - App funktioniert ohne Firebase
}

export { auth, db, app }

// Firebase ready indicator - development only
if (import.meta.env.DEV && !window._firebaseConfigLogged) {
  console.log('🔥 Firebase ready')
  window._firebaseConfigLogged = true
}