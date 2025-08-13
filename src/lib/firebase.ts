// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, getDoc, doc, getFirestore, enableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId optional
};

// Firebase ready indicator - development only
if (import.meta.env.DEV && !window._firebaseConfigLogged) {
  console.log('🔥 Firebase initialized')
  window._firebaseConfigLogged = true
}

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error('Firebase config is incomplete! Check your environment variables.');
}

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

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth + persistente Sitzung
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn('Auth persistence warning:', e?.message || e)
);

// Firestore mit Auto-Long-Polling (replit/proxy-freundlich) + optimiert
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true, // Automatische Erkennung für Replit
  cacheSizeBytes: 40000000, // 40MB Cache für bessere Performance
  ignoreUndefinedProperties: true, // Bessere Performance bei undefined values
  localCache: {
    kind: 'persistent',
    tabManager: 'optimistic'
  }
});

// Mobile-specific settings
if (typeof window !== 'undefined') {
  // Enable offline persistence for mobile
  enableNetwork(db).catch(console.warn);
}

// keine Default-Exporte → vermeidet Barrel-/Star-Export-Probleme