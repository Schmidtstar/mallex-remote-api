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

// Lazy loading für bessere Performance
let auth: any = null
let db: any = null

export const getFirebaseAuth = async () => {
  if (!auth) {
    const { getAuth, browserLocalPersistence, setPersistence } = await import('firebase/auth')
    auth = getAuth(app)
    await setPersistence(auth, browserLocalPersistence).catch((e) =>
      console.warn('Auth persistence warning:', e?.message || e)
    )
  }
  return auth
}

export const getFirestore = async () => {
  if (!db) {
    const { initializeFirestore, enableNetwork } = await import('firebase/firestore')
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      cacheSizeBytes: 40000000,
      ignoreUndefinedProperties: true,
      localCache: {
        kind: 'persistent',
        tabManager: 'optimistic'
      }
    })

    if (typeof window !== 'undefined') {
      await enableNetwork(db).catch(console.warn)
    }
  }
  return db
}

// Legacy exports für Backward Compatibility
export const auth = await getFirebaseAuth()
export const db = await getFirestore()

// Firebase ready indicator - development only
if (import.meta.env.DEV && !window._firebaseConfigLogged) {
  console.log('🔥 Firebase ready')
  window._firebaseConfigLogged = true
}