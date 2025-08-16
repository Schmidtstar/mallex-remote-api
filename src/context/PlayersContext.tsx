import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
// Player type lokal definiert da deprecated API entfernt
interface Player {
  id: string;
  name: string;
  score: number;
}

type PlayersContextType = {
  players: Player[]
  addPlayer: (name: string) => Promise<void>
  removePlayer: (id: string) => Promise<void>
  mode: 'firebase' | 'localStorage'
  loading: boolean
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined)

// Hook mit konsistentem Export für Fast Refresh
function usePlayersContext() {
  const context = useContext(PlayersContext)
  if (!context) {
    throw new Error('usePlayersContext must be used within a PlayersProvider')
  }
  return context
}

export { usePlayersContext }

type PlayersProviderProps = {
  children: ReactNode
}

const STORAGE_KEY = 'mallex-players'

export function PlayersProvider({ children }: PlayersProviderProps) {
  const { loading: authLoading, user } = useAuth() // Assuming 'user' is available from useAuth
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const mode = useMemo((): 'firebase' | 'localStorage' => {
    // Force localStorage until Firebase players collection is properly configured
    return 'localStorage'
  }, [])

  // Load players when auth state changes - ONLY localStorage for now
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let retryCount = 0
    const maxRetries = 3

    const fetchPlayers = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Add connection timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );

        // Use localStorage for now (Firebase rules need players collection setup)
        const saved = localStorage.getItem(STORAGE_KEY)
        const playersList = saved ? JSON.parse(saved) : []
        setPlayers(playersList)
        setLoading(false)
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to load players:', error)
        }
        setPlayers([])
        setLoading(false)
      }
    }

    // Temporarily use localStorage for player loading
    const loadPlayersFromLocalStorage = async () => {
      setLoading(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        let playersList = saved ? JSON.parse(saved) : [];
        
        // Wenn keine Spieler in localStorage, Demo-Daten hinzufügen
        if (playersList.length === 0) {
          const demoPlayers = [
            { id: '1', name: 'JP', score: 0 },
            { id: '2', name: 'BP', score: 0 },
            { id: '3', name: 'DM', score: 0 },
            { id: '4', name: 'GB', score: 0 },
            { id: '5', name: 'Schmidtstar', score: 0 }
          ];
          playersList = demoPlayers;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPlayers));
          console.log('📦 Demo players added to localStorage:', demoPlayers);
        }
        
        setPlayers(playersList);
        console.log('✅ Players loaded from localStorage:', playersList);
        setLoading(false);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to load players from localStorage:', error);
        }
        setPlayers([]);
        setLoading(false);
      }
    };

    loadPlayersFromLocalStorage();

  }, [authLoading, user]) // Dependency array includes user

  const handleAddPlayer = useCallback(async (name: string) => {
    if (!name.trim()) return

    try {
      // Only localStorage mode until Firebase setup is complete
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        score: 0
      }
      const updatedPlayers = [...players, newPlayer]
      setPlayers(updatedPlayers)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to add player:', error)
      }
      throw error
    }
  }, [players])

  const handleRemovePlayer = useCallback(async (id: string) => {
    if (!id) {
      console.warn('❌ No player ID provided for removal')
      return
    }
    
    try {
      const playerToRemove = players.find(p => p.id === id)
      if (!playerToRemove) {
        console.warn('❌ Player not found:', id)
        throw new Error('Player not found')
      }
      
      const updatedPlayers = players.filter(p => p.id !== id)
      setPlayers(updatedPlayers)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
      
      console.log('✅ Player removed:', playerToRemove.name)
    } catch (error) {
      console.error('❌ Failed to remove player:', error)
      throw error
    }
  }, [players])

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