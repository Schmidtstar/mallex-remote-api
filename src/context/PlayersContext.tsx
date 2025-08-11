import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'

type Player = {
  id: string
  name: string
  // Add other player properties here if necessary
}

type PlayersCtx = {
  players: Player[]
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
  const [players, setPlayers] = useState<Player[]>([])
  const { user, mode } = useAuth()
  const STORAGE_KEY = 'mallex.players'

  const loadPlayers = useCallback(async () => {
    try {
      if (mode === 'firebase' && user && !user.isAnonymous && user.uid) {
        // Guard against empty user.uid
        const playersCollectionRef = collection(db, 'users', user.uid, 'players')
        const playersSnapshot = await getDocs(playersCollectionRef)
        const playersData: Player[] = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Player, 'id'>)
        }))
        setPlayers(playersData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playersData))
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          setPlayers(JSON.parse(saved))
        }
      }
    } catch (error) {
      console.warn('Failed to load players, using localStorage fallback:', error)
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setPlayers(JSON.parse(saved))
      }
    }
  }, [user, mode, STORAGE_KEY])

  const savePlayers = useCallback(async () => {
    try {
      // Always save to localStorage as fallback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players))

      // Only save to Firestore for authenticated non-anonymous users
      if (mode === 'firebase' && user && !user.isAnonymous && user.uid && players.length > 0) {
        // Save each player as a separate document
        for (const player of players) {
          if (player.id && player.name) {
            const playerDocRef = doc(db, 'users', user.uid, 'players', player.id)
            await setDoc(playerDocRef, { name: player.name }, { merge: true })
          }
        }
      }
    } catch (error) {
      console.warn('Failed to save to Firestore, saved locally:', error)
    }
  }, [players, user, mode, STORAGE_KEY])

  const addPlayer = useCallback((name: string) => {
    if (name.trim() && !players.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      const newPlayer: Player = { id: Date.now().toString(), name: name.trim() }
      setPlayers(prev => [...prev, newPlayer])
    }
  }, [players])

  const removePlayer = useCallback((name: string) => {
    setPlayers(prev => prev.filter(p => p.name !== name))
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