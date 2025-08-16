
import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { doc, setDoc, getDoc, increment, deleteDoc, onSnapshot, collection, query, where } from 'firebase/firestore'
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
  const [firebaseListeners, setFirebaseListeners] = useState<Map<string, () => void>>(new Map())

  const mode = useMemo((): 'firebase' | 'localStorage' => {
    return 'localStorage' // Hybrides System bleibt bestehen
  }, [])

  // Normalisierte Player-ID für Firebase
  const normalizePlayerId = useCallback((name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }, [])

  // Real-time Firebase Listener für einzelnen Spieler
  const setupFirebaseListener = useCallback((player: Player) => {
    const playerId = normalizePlayerId(player.name)
    
    // Verhindere doppelte Listener
    if (firebaseListeners.has(playerId)) {
      return
    }

    try {
      const playerRef = doc(db, 'players', playerId)
      const unsubscribe = onSnapshot(playerRef, (doc) => {
        if (doc.exists()) {
          const firebaseData = doc.data()
          const updatedArenaPoints = firebaseData.arenaPoints || 0
          
          // Aktualisiere nur wenn sich Punkte geändert haben
          setPlayers(prevPlayers => 
            prevPlayers.map(p => 
              p.id === player.id 
                ? { ...p, arenaPoints: updatedArenaPoints }
                : p
            )
          )
          
          // Aktualisiere localStorage
          const localStoragePlayers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
          const updatedLocalStorage = localStoragePlayers.map((p: Player) => 
            p.id === player.id 
              ? { ...p, arenaPoints: updatedArenaPoints }
              : p
          )
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocalStorage))
          
          if (import.meta.env.DEV) {
            console.log(`🔄 Live update für ${player.name}: ${updatedArenaPoints} Punkte`)
          }
        }
      }, (error) => {
        console.warn(`⚠️ Firebase Listener Fehler für ${player.name}:`, error)
      })

      // Listener registrieren
      setFirebaseListeners(prev => new Map(prev.set(playerId, unsubscribe)))
    } catch (error) {
      console.warn(`❌ Firebase Listener Setup fehlgeschlagen für ${player.name}:`, error)
    }
  }, [normalizePlayerId, firebaseListeners])

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

        // KRITISCH: Bestehende Spieler-Daten reparieren (fehlende Felder hinzufügen)
        playersList = playersList.map(player => ({
          id: player.id || Date.now().toString(),
          name: player.name || 'Unbekannt',
          score: player.score || 0,
          arenaPoints: player.arenaPoints || 0
        }))

        // Reparierte Daten speichern
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playersList))
        console.log('🔧 Spieler-Datenstruktur repariert:', playersList)
        
        // WICHTIG: arenaPoints aus Firebase laden und mergen
        const playersWithFirebasePoints = await Promise.all(
          playersList.map(async (player) => {
            try {
              // Firebase Punkte für jeden Spieler abrufen
              const playerId = normalizePlayerId(player.name)
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
        
        // Real-time Listener für jeden Spieler einrichten
        playersWithFirebasePoints.forEach(player => {
          setupFirebaseListener(player)
        })
        
        console.log('✅ Players mit Firebase-Punkten und Live-Sync geladen:', playersWithFirebasePoints);
        setLoading(false);
      } catch (error) {
        console.warn('❌ Fehler beim Laden der Spieler:', error);
        setPlayers([]);
        setLoading(false);
      }
    };

    loadPlayersFromLocalStorage();

    // Cleanup: Alle Firebase Listener entfernen
    return () => {
      firebaseListeners.forEach(unsubscribe => unsubscribe())
      setFirebaseListeners(new Map())
    }
  }, [authLoading, user, setupFirebaseListener])

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
      
      // Firebase Listener für neuen Spieler einrichten
      setupFirebaseListener(newPlayer)
      
      console.log('✅ Spieler hinzugefügt:', newPlayer.name)
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen:', error)
      throw error
    }
  }, [players, setupFirebaseListener])

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
      
      // Firebase Listener entfernen
      const playerId = normalizePlayerId(playerToRemove.name)
      const unsubscribe = firebaseListeners.get(playerId)
      if (unsubscribe) {
        unsubscribe()
        setFirebaseListeners(prev => {
          const newMap = new Map(prev)
          newMap.delete(playerId)
          return newMap
        })
        console.log('🔥 Firebase Listener entfernt für:', playerToRemove.name)
      }
      
      const updatedPlayers = players.filter(p => p.id !== id)
      console.log('📝 Neue Spielerliste:', updatedPlayers.map(p => `${p.id}: ${p.name}`))
      
      // State UND localStorage aktualisieren
      setPlayers(updatedPlayers)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
      
      console.log('✅ Spieler erfolgreich entfernt:', playerToRemove.name)
      
      // Firebase Eintrag löschen (optional)
      try {
        const playerRef = doc(db, 'players', playerId)
        await deleteDoc(playerRef)
        console.log('🔥 Firebase Eintrag gelöscht:', playerId)
      } catch (firebaseError) {
        console.warn('⚠️ Firebase Löschung fehlgeschlagen (nicht kritisch):', firebaseError)
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Entfernen des Spielers:', error)
      throw error
    }
  }, [players, firebaseListeners, normalizePlayerId])

  const handleUpdatePlayerArenaPoints = useCallback(async (name: string, points: number) => {
    try {
      console.log('🎯 Arena-Punkte Update:', name, 'Punkte:', points)
      
      // 1. Firebase Update (Hauptspeicher)
      const playerId = normalizePlayerId(name)
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
        
        console.log('✅ Firebase Arena-Punkte aktualisiert:', name, 'Punkte:', points)
        // Real-time Listener wird automatisch State aktualisieren
        
      } catch (firebaseError) {
        console.warn('⚠️ Firebase Update fehlgeschlagen, nur localStorage:', firebaseError)
        
        // Fallback: nur localStorage mit verbesserter Validierung
        const updatedPlayers = players.map(player => {
          if (player.name.toLowerCase() === name.toLowerCase()) {
            const newArenaPoints = (player.arenaPoints || 0) + points
            console.log(`📊 ${player.name}: ${player.arenaPoints || 0} → ${newArenaPoints}`)
            return { ...player, arenaPoints: newArenaPoints }
          }
          return player
        })
        
        setPlayers(updatedPlayers)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers))
        
        console.log('💾 Punkte offline gespeichert:', name, 'Neue Punkte:', updatedPlayers.find(p => p.name.toLowerCase() === name.toLowerCase())?.arenaPoints)
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Arena-Punkte:', error)
      throw error
    }
  }, [players, normalizePlayerId])

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
