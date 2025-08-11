
import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { addPlayer, removePlayer, listenPlayers, Player } from '@/lib/playersApi'

type PlayersContextType = {
  players: Player[]
  addPlayer: (name: string) => Promise<void>
  removePlayer: (id: string) => Promise<void>
  mode: 'firebase' | 'localStorage'
  loading: boolean
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined)

export function usePlayersContext() {
  const context = useContext(PlayersContext)
  if (!context) {
    throw new Error('usePlayersContext must be used within a PlayersProvider')
  }
  return context
}

type PlayersProviderProps = {
  children: ReactNode
}

const STORAGE_KEY = 'mallex-players'

export function PlayersProvider({ children }: PlayersProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const mode = useMemo(() => {
    return user && !user.isAnonymous ? 'firebase' : 'localStorage'
  }, [user])

  // Load players when auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const loadPlayers = async () => {
      if (authLoading) return

      setLoading(true)
      try {
        if (mode === 'firebase' && user && user.uid) {
          // Listen to Firebase players
          unsubscribe = listenPlayers(user.uid, (playersList) => {
            setPlayers(playersList)
            setLoading(false)
          })
        } else {
          // Load from localStorage
          const saved = localStorage.getItem(STORAGE_KEY)
          const playersList = saved ? JSON.parse(saved) : []
          setPlayers(playersList)
          setLoading(false)
        }
      } catch (error) {
        console.warn('Failed to load players:', error)
        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY)
        const playersList = saved ? JSON.parse(saved) : []
        setPlayers(playersList)
        setLoading(false)
      }
    }

    loadPlayers()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [mode, user, authLoading])

  const handleAddPlayer = useCallback(async (name: string) => {
    if (!name.trim()) return

    try {
      if (mode === 'firebase' && user && user.uid) {
        await addPlayer(user.uid, name.trim())
        // Firebase listener will update the state
      } else {
        // localStorage mode
        const newPlayer: Player = {
          id: Date.now().toString(),
          name: name.trim()
        }
        const updatedPlayers = [...players, newPlayer]
        setPlayers(updatedPlayers)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
      }
    } catch (error) {
      console.warn('Failed to add player:', error)
      throw error
    }
  }, [mode, user, players])

  const handleRemovePlayer = useCallback(async (id: string) => {
    try {
      if (mode === 'firebase' && user && user.uid) {
        await removePlayer(user.uid, id)
        // Firebase listener will update the state
      } else {
        // localStorage mode
        const updatedPlayers = players.filter(p => p.id !== id)
        setPlayers(updatedPlayers)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
      }
    } catch (error) {
      console.warn('Failed to remove player:', error)
      throw error
    }
  }, [mode, user, players])

  const value = useMemo(() => ({
    players,
    addPlayer: handleAddPlayer,
    removePlayer: handleRemovePlayer,
    mode,
    loading
  }), [players, handleAddPlayer, handleRemovePlayer, mode, loading])

  return (
    <PlayersContext.Provider value={value}>
      {children}
    </PlayersContext.Provider>
  )
}
