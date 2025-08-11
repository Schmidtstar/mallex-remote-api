import { readFirebaseEnv, hasAuthEnv } from '@/utils/env'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

let authInstance: import('firebase/auth').Auth | null = null

export async function getFirebase(): Promise<{
  app: any
  auth: import('firebase/auth').Auth
  signInWithEmailAndPassword: typeof import('firebase/auth').signInWithEmailAndPassword
  createUserWithEmailAndPassword: typeof import('firebase/auth').createUserWithEmailAndPassword
  signInAnonymously: typeof import('firebase/auth').signInAnonymously
  signOut: typeof import('firebase/auth').signOut
  onAuthStateChanged: typeof import('firebase/auth').onAuthStateChanged
  analytics?: any
} | null> {
  const cfg = readFirebaseEnv()
  if (!hasAuthEnv(cfg)) {
    console.warn('[MALLEX] Firebase ENV unvollständig – starte im Gastmodus.')
    return null
  }

  const [{ initializeApp }, { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged }] =
    await Promise.all([import('firebase/app'), import('firebase/auth')])

  const app = initializeApp(cfg as any)
  authInstance = getAuth(app)

  let analytics: any
  if (cfg.measurementId) {
    try {
      const { getAnalytics, isSupported } = await import('firebase/analytics')
      if (await isSupported()) analytics = getAnalytics(app)
    } catch {/* optional */}
  }

  return { app, auth: authInstance, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged, analytics }
}

export { authInstance as auth }