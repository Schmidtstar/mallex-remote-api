
import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react'
import { getFirebase } from '../lib/firebase'

type User = { uid: string; email?: string | null; isAnonymous: boolean } | null

type AuthCtx = {
  user: User
  loading: boolean
  mode: 'guest' | 'firebase'
  error: string | null
  isAnonymous: boolean
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (email: string, password: string) => Promise<void>
  signInGuest: () => Promise<void>
  loginAsGuest: () => Promise<void>
  upgradeToEmail: (email: string, password: string) => Promise<void>
  signOutAll: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)
export const useAuth = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('AuthContext missing')
  return c
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fbMode, setFbMode] = useState<'guest' | 'firebase'>('guest')

  useEffect(() => {
    let unsub = () => {}
    setLoading(true)
    getFirebase().then((fb) => {
      if (!fb) {
        setFbMode('guest')
        setUser({ uid: 'guest', isAnonymous: true, email: null })
        setLoading(false)
        return
      }
      setFbMode('firebase')
      unsub = fb.onAuthStateChanged(fb.auth, (u) => {
        if (u) setUser({ uid: u.uid, email: u.email, isAnonymous: u.isAnonymous })
        else setUser(null)
        setLoading(false)
      })
    })
    return () => unsub()
  }, [])

  const loginAsGuest = useCallback(async () => {
    setError(null)
    try {
      const fb = await getFirebase()
      if (!fb) {
        // Fallback für lokalen Gastmodus
        setUser({ uid: 'guest', isAnonymous: true, email: null })
        return
      }
      await fb.signInAnonymously(fb.auth)
    } catch (e: any) {
      if (e?.code === 'auth/admin-restricted-operation') {
        setError('Anonymous Sign-In ist in Firebase nicht aktiviert. Bitte im Firebase-Auth-Panel aktivieren.')
      } else {
        setError(e?.message ?? 'Guest login failed')
      }
    }
  }, [])

  const upgradeToEmail = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const fb = await getFirebase()
      if (!fb) throw new Error('Firebase nicht konfiguriert')
      if (!fb.auth.currentUser) throw new Error('Kein Benutzer angemeldet')
      
      const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth')
      const credential = EmailAuthProvider.credential(email, password)
      await linkWithCredential(fb.auth.currentUser, credential)
    } catch (e: any) {
      let errorKey = 'auth.upgrade.error.generic'
      if (e?.code === 'auth/email-already-in-use') errorKey = 'auth.upgrade.error.emailInUse'
      else if (e?.code === 'auth/invalid-email') errorKey = 'auth.upgrade.error.invalidEmail'
      else if (e?.code === 'auth/weak-password') errorKey = 'auth.upgrade.error.weakPassword'
      
      setError(errorKey)
      throw new Error(errorKey)
    }
  }, [])

  const api = useMemo<AuthCtx>(() => ({
    user, loading, mode: fbMode, error,
    isAnonymous: user?.isAnonymous ?? false,
    async signInEmail(email, password) {
      setError(null)
      const fb = await getFirebase()
      if (!fb) throw new Error('Firebase nicht konfiguriert')
      await fb.signInWithEmailAndPassword(fb.auth, email, password)
    },
    async signUpEmail(email, password) {
      setError(null)
      const fb = await getFirebase()
      if (!fb) throw new Error('Firebase nicht konfiguriert')
      await fb.createUserWithEmailAndPassword(fb.auth, email, password)
    },
    async signInGuest() {
      setError(null)
      const fb = await getFirebase()
      if (!fb) { setUser({ uid: 'guest', isAnonymous: true, email: null }); return }
      await fb.signInAnonymously(fb.auth)
    },
    loginAsGuest,
    upgradeToEmail,
    async signOutAll() {
      setError(null)
      const fb = await getFirebase()
      if (!fb) { setUser({ uid: 'guest', isAnonymous: true, email: null }); return }
      await fb.signOut(fb.auth)
    }
  }), [user, loading, fbMode, error, loginAsGuest, upgradeToEmail])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
