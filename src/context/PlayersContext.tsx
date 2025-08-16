
import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { doc, setDoc, getDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Player type mit allen nötigen Feldern
interface Player {
  id: string;
  name: string;
  score: number;
  arenaPoints: number;
}

type PlayersContextType = {
  players: Player[]
  addPlayer: (name: string) => Promise<void>
  removePlayer: (id: string) => Promise<void>
  updatePlayerArenaPoints: (name: string, points: number) => Promise<void>
  mode: 'firebase' | 'localStorage'
  loading: boolean
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined)

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
  const { loading: authLoading, user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const mode = useMemo((): 'firebase' | 'localStorage' => {
    return 'localStorage' // Hybrides System bleibt bestehen
  }, [])

  // Spieler laden beim Start
  useEffect(() => {
    const loadPlayersFromLocalStorage = async () => {
      setLoading(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        let playersList = saved ? JSON.parse(saved) : [];
        
        // Demo-Daten nur wenn komplett leer
        if (playersList.length === 0) {
          const demoPlayers = [
            { id: '1', name: 'JP', score: 0, arenaPoints: 0 },
            { id: '2', name: 'BP', score: 0, arenaPoints: 0 },
            { id: '3', name: 'DM', score: 0, arenaPoints: 0 },
            { id: '4', name: 'GB', score: 0, arenaPoints: 0 },
            { id: '5', name: 'Schmidtstar', score: 0, arenaPoints: 0 }
          ];
          playersList = demoPlayers;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPlayers));
          console.log('📦 Demo players added to localStorage:', demoPlayers);
        }
        
        // WICHTIG: arenaPoints aus Firebase laden und mergen
        const playersWithFirebasePoints = await Promise.all(
          playersList.map(async (player) => {
            try {
              // Firebase Punkte für jeden Spieler abrufen
              const playerId = player.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
              const playerRef = doc(db, 'players', playerId)
              const playerDoc = await getDoc(playerRef)
              
              const firebasePoints = playerDoc.exists() ? playerDoc.data().arenaPoints || 0 : 0
              
              return {
                ...player,
                arenaPoints: firebasePoints // Firebase überschreibt localStorage
              }
            } catch (error) {
              // Fallback: localStorage Punkte behalten
              return {
                ...player,
                arenaPoints: player.arenaPoints || 0
              }
            }
          })
        )
        
        // Aktualisierte Punkte wieder speichern
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playersWithFirebasePoints));
        setPlayers(playersWithFirebasePoints);
        
        console.log('✅ Players mit Firebase-Punkten geladen:', playersWithFirebasePoints);
        setLoading(false);
      } catch (error) {
        console.warn('❌ Fehler beim Laden der Spieler:', error);
        setPlayers([]);
        setLoading(false);
      }
    };

    loadPlayersFromLocalStorage();
  }, [authLoading, user])

  const handleAddPlayer = useCallback(async (name: string) => {
    if (!name.trim()) return

    try {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        score: 0,
        arenaPoints: 0
      }
      const updatedPlayers = [...players, newPlayer]
      setPlayers(updatedPlayers)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
      console.log('✅ Spieler hinzugefügt:', newPlayer.name)
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen:', error)
      throw error
    }
  }, [players])

  const handleRemovePlayer = useCallback(async (id: string) => {
    if (!id) {
      console.warn('❌ Keine Spieler-ID für Entfernung angegeben')
      return
    }
    
    try {
      console.log('🗑️ Versuche Spieler zu entfernen. ID:', id)
      console.log('📋 Aktuelle Spieler:', players.map(p => `${p.id}: ${p.name}`))
      
      const playerToRemove = players.find(p => p.id === id)
      if (!playerToRemove) {
        console.warn('❌ Spieler nicht gefunden:', id)
        throw new Error(`Spieler mit ID ${id} nicht gefunden`)
      }
      
      console.log('🎯 Entferne Spieler:', playerToRemove.name)
      
      const updatedPlayers = players.filter(p => p.id !== id)
      console.log('📝 Neue Spielerliste:', updatedPlayers.map(p => `${p.id}: ${p.name}`))
      
      // State UND localStorage aktualisieren
      setPlayers(updatedPlayers)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
      
      console.log('✅ Spieler erfolgreich entfernt:', playerToRemove.name)
      
      // Firebase Eintrag auch löschen (optional)
      try {
        const playerId = playerToRemove.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        const playerRef = doc(db, 'players', playerId)
        await setDoc(playerRef, { deleted: true, deletedAt: new Date() }, { merge: true })
        console.log('🔥 Firebase Eintrag als gelöscht markiert:', playerId)
      } catch (firebaseError) {
        console.warn('⚠️ Firebase Löschung fehlgeschlagen (nicht kritisch):', firebaseError)
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Entfernen des Spielers:', error)
      throw error
    }
  }, [players])

  const handleUpdatePlayerArenaPoints = useCallback(async (name: string, points: number) => {
    try {
      console.log('🎯 Arena-Punkte Update:', name, 'Punkte:', points)
      
      // 1. Firebase Update (Hauptspeicher)
      const playerId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      const playerRef = doc(db, 'players', playerId)
      
      try {
        const playerDoc = await getDoc(playerRef)
        if (playerDoc.exists()) {
          await setDoc(playerRef, {
            arenaPoints: increment(points),
            updatedAt: new Date()
          }, { merge: true })
        } else {
          await setDoc(playerRef, {
            name: name,
            arenaPoints: points,
            totalGames: 1,
            wins: points > 1 ? 1 : 0,
            losses: points === 1 ? 1 : 0,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        // 2. Aktuelle Punkte aus Firebase abrufen
        const updatedDoc = await getDoc(playerRef)
        const currentPoints = updatedDoc.exists() ? updatedDoc.data().arenaPoints || 0 : 0
        
        // 3. localStorage State aktualisieren
        const updatedPlayers = players.map(player => 
          player.name.toLowerCase() === name.toLowerCase() 
            ? { ...player, arenaPoints: currentPoints }
            : player
        )
        setPlayers(updatedPlayers)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
        
        console.log('✅ Arena-Punkte erfolgreich aktualisiert:', name, 'Neue Gesamtpunkte:', currentPoints)
      } catch (firebaseError) {
        console.warn('⚠️ Firebase Update fehlgeschlagen, nur localStorage:', firebaseError)
        
        // Fallback: nur localStorage
        const updatedPlayers = players.map(player => 
          player.name.toLowerCase() === name.toLowerCase() 
            ? { ...player, arenaPoints: (player.arenaPoints || 0) + points }
            : player
        )
        setPlayers(updatedPlayers)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
        
        console.log('💾 Punkte offline gespeichert:', name, 'Punkte:', points)
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Arena-Punkte:', error)
      throw error
    }
  }, [players])

  const value = useMemo(() => ({
    players,
    addPlayer: handleAddPlayer,
    removePlayer: handleRemovePlayer,
    updatePlayerArenaPoints: handleUpdatePlayerArenaPoints,
    mode,
    loading
  }), [players, handleAddPlayer, handleRemovePlayer, handleUpdatePlayerArenaPoints, mode, loading])

  return (
    <PlayersContext.Provider value={value}>
      {children}
    </PlayersContext.Provider>
  )
}
