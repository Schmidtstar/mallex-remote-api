export type FirebaseBundle = {
  app: any
  auth: import('firebase/auth').Auth
  signInWithEmailAndPassword: typeof import('firebase/auth').signInWithEmailAndPassword
  createUserWithEmailAndPassword: typeof import('firebase/auth').createUserWithEmailAndPassword
  signInAnonymously: typeof import('firebase/auth').signInAnonymously
  signOut: typeof import('firebase/auth').signOut
  onAuthStateChanged: typeof import('firebase/auth').onAuthStateChanged
  analytics?: any
}

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

function hasAuthEnv() {
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)
}

let cached: FirebaseBundle | null = null

export async function getFirebase(): Promise<FirebaseBundle | null> {
  if (!hasAuthEnv()) return null
  if (cached) return cached

  const [{ initializeApp }, { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged }] =
    await Promise.all([import('firebase/app'), import('firebase/auth')])

  const app = initializeApp(cfg as any)
  const auth = getAuth(app)

  let analytics: any
  if (cfg.measurementId) {
    try {
      const { getAnalytics, isSupported } = await import('firebase/analytics')
      if (await isSupported()) analytics = getAnalytics(app)
    } catch {}
  }

  cached = { app, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged, analytics }
  return cached
}
