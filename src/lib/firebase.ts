import { readFirebaseEnv, hasAuthEnv } from '@/utils/env'

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
  const auth = getAuth(app)

  let analytics: any
  if (cfg.measurementId) {
    try {
      const { getAnalytics, isSupported } = await import('firebase/analytics')
      if (await isSupported()) analytics = getAnalytics(app)
    } catch {/* optional */}
  }

  return { app, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged, analytics }
}