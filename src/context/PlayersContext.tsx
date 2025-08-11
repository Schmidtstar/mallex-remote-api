import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { db } from '@/lib/firebase'

type PlayersCtx = {
  players: string[]
  addPlayer: (name: string) => void
  removePlayer: (name: string) => void
  loadPlayers: () => Promise<void>
  savePlayers: () => Promise<void>
}

const defaultContext: PlayersCtx = {
  players: [],
  addPlayer: () => {},
  removePlayer: () => {},
  loadPlayers: async () => {},
  savePlayers: async () => {}
}

const Ctx = createContext<PlayersCtx>(defaultContext)

export const usePlayers = () => {
  const c = useContext(Ctx)
  if (!c || c === defaultContext) throw new Error('usePlayers must be used within PlayersProvider')
  return c
}

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<string[]>([])
  const { user, mode } = useAuth()

  const loadPlayers = useCallback(async () => {
    try {
      // Only use Firestore for authenticated non-anonymous users
      if (mode === 'firebase' && user && !user.isAnonymous) {
        const fb = await db() // Use db() directly
        if (fb) {
          const { getFirestore, doc, getDoc } = await import('firebase/firestore')
          const firestore = getFirestore(fb.app)
          const docRef = doc(firestore, 'users', user.uid, 'data', 'players')
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()
            setPlayers(data.players || [])
            return
          }
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('mallex.players')
      if (saved) {
        setPlayers(JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Failed to load players, using localStorage fallback:', error)
      const saved = localStorage.getItem('mallex.players')
      if (saved) {
        setPlayers(JSON.parse(saved))
      }
    }
  }, [user, mode])

  const savePlayers = useCallback(async () => {
    try {
      // Always save to localStorage as fallback
      localStorage.setItem('mallex.players', JSON.stringify(players))

      // Only save to Firestore for authenticated non-anonymous users
      if (mode === 'firebase' && user && !user.isAnonymous) {
        const fb = await db() // Use db() directly
        if (fb) {
          const { getFirestore, doc, setDoc } = await import('firebase/firestore')
          const firestore = getFirestore(fb.app)
          const docRef = doc(firestore, 'users', user.uid, 'data', 'players')
          await setDoc(docRef, { players })
        }
      }
    } catch (error) {
      console.warn('Failed to save to Firestore, saved locally:', error)
    }
  }, [players, user, mode])

  const addPlayer = useCallback((name: string) => {
    if (name.trim() && !players.includes(name.trim())) {
      setPlayers(prev => [...prev, name.trim()])
    }
  }, [players])

  const removePlayer = useCallback((name: string) => {
    setPlayers(prev => prev.filter(p => p !== name))
  }, [])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    if (players.length > 0) {
      savePlayers()
    }
  }, [players, savePlayers])

  const api = useMemo<PlayersCtx>(() => ({
    players,
    addPlayer,
    removePlayer,
    loadPlayers,
    savePlayers
  }), [players, addPlayer, removePlayer, loadPlayers, savePlayers])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}