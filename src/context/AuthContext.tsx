import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getFirebase } from '@/lib/firebase'

type User = { uid: string; email?: string | null; isAnonymous: boolean } | null

type AuthCtx = {
  user: User
  loading: boolean
  mode: 'guest' | 'firebase'
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (email: string, password: string) => Promise<void>
  signInGuest: () => Promise<void>
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

  const api = useMemo<AuthCtx>(() => ({
    user, loading, mode: fbMode,
    async signInEmail(email, password) {
      const fb = await getFirebase()
      if (!fb) throw new Error('Firebase nicht konfiguriert')
      await fb.signInWithEmailAndPassword(fb.auth, email, password)
    },
    async signUpEmail(email, password) {
      const fb = await getFirebase()
      if (!fb) throw new Error('Firebase nicht konfiguriert')
      await fb.createUserWithEmailAndPassword(fb.auth, email, password)
    },
    async signInGuest() {
      const fb = await getFirebase()
      if (!fb) { setUser({ uid: 'guest', isAnonymous: true, email: null }); return }
      await fb.signInAnonymously(fb.auth)
    },
    async signOutAll() {
      const fb = await getFirebase()
      if (!fb) { setUser({ uid: 'guest', isAnonymous: true, email: null }); return }
      await fb.signOut(fb.auth)
    }
  }), [user, loading, fbMode])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
