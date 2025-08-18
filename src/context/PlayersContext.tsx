import React, { createContext, useContext, useState, useEffect, ReactNode, memo, useMemo, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { doc, setDoc, getDoc, increment, deleteDoc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore'
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

export const PlayersProvider = memo(({ children }: PlayersProviderProps) => {
  const { loading: authLoading, user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [firebaseListeners, setFirebaseListeners] = useState<Map<string, () => void>>(new Map())
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const mode = useMemo((): 'firebase' | 'localStorage' => {
    return 'localStorage' // Hybrides System bleibt bestehen
  }, [])

  // Normalisierte Player-ID für Firebase
  const normalizePlayerId = useCallback((name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }, [])

  // Optimierter Firebase Listener mit Debouncing
  const setupFirebaseListener = useCallback((player: Player) => {
    const playerId = normalizePlayerId(player.name)

    // Verhindere doppelte Listener
    if (firebaseListeners.has(playerId)) {
      firebaseListeners.get(playerId)?.() // Cleanup existing
    }

    try {
      const playerRef = doc(db, 'players', playerId)
      const unsubscribe = onSnapshot(playerRef, (doc) => {
        if (doc.exists()) {
          const firebaseData = doc.data()
          const updatedArenaPoints = firebaseData.arenaPoints || 0

          // Debounce Updates um Performance zu verbessern
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }

          updateTimeoutRef.current = setTimeout(() => {
            setPlayers(prevPlayers => {
              const targetPlayer = prevPlayers.find(p => p.id === player.id)
              if (targetPlayer && targetPlayer.arenaPoints === updatedArenaPoints) {
                return prevPlayers // Keine Änderung, verhindere Re-render
              }

              const newPlayers = prevPlayers.map(p => 
                p.id === player.id 
                  ? { ...p, arenaPoints: updatedArenaPoints }
                  : p
              )

              // Batch localStorage Update
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayers))

              if (import.meta.env.DEV) {
                console.log(`🔄 Live update für ${player.name}: ${updatedArenaPoints} Punkte`)
              }

              return newPlayers
            })
          }, 100) // 100ms Debounce
        }
      }, (error) => {
        console.warn(`⚠️ Firebase Listener Fehler für ${player.name}:`, error)
        // Fallback: Remove broken listener
        firebaseListeners.delete(playerId)
      })

      // Listener registrieren
      setFirebaseListeners(prev => new Map(prev.set(playerId, unsubscribe)))
    } catch (error) {
      console.warn(`❌ Firebase Listener Setup fehlgeschlagen für ${player.name}:`, error)
    }
  }, [normalizePlayerId, firebaseListeners]) // Added firebaseListeners to dependency array

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

        // OPTIMIERT: Batch Firebase Query für bessere Performance
        const playersWithFirebasePoints = await Promise.allSettled(
          playersList.map(async (player) => {
            try {
              const playerId = normalizePlayerId(player.name)
              const playerRef = doc(db, 'players', playerId)
              const playerDoc = await getDoc(playerRef)

              const firebasePoints = playerDoc.exists() ? playerDoc.data().arenaPoints || 0 : 0

              return {
                ...player,
                arenaPoints: firebasePoints
              }
            } catch (error) {
              // Graceful degradation
              console.warn(`⚠️ Firebase load failed for ${player.name}, using localStorage`)
              return {
                ...player,
                arenaPoints: player.arenaPoints || 0
              }
            }
          })
        ).then(results => 
          results.map(result => 
            result.status === 'fulfilled' ? result.value : result.reason
          )
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

    // Cleanup: Alle Firebase Listener und Timeouts entfernen
    return () => {
      firebaseListeners.forEach(unsubscribe => unsubscribe())
      setFirebaseListeners(new Map())
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [authLoading, user, setupFirebaseListener, normalizePlayerId]) // Added normalizePlayerId to dependency array

  // Input-Validierung und XSS-Schutz
  const validatePlayerName = useCallback((name: string): { isValid: boolean; error?: string } => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return { isValid: false, error: 'Name darf nicht leer sein' }
    }

    if (trimmedName.length < 2) {
      return { isValid: false, error: 'Name muss mindestens 2 Zeichen haben' }
    }

    if (trimmedName.length > 20) {
      return { isValid: false, error: 'Name darf maximal 20 Zeichen haben' }
    }

    // XSS-Schutz: Gefährliche Zeichen entfernen
    const dangerousChars = /<|>|"|'|&|script|javascript|onerror|onload|onclick|onmouseover|eval|alert|iframe|object|embed|form|input/gi
    if (dangerousChars.test(trimmedName)) {
      return { isValid: false, error: 'Name enthält unerlaubte Zeichen' }
    }

    // Zusätzlicher Unicode-Schutz und SQL-Injection-Prävention
    if (!/^[\w\säöüÄÖÜß\-_.]+$/u.test(trimmedName) || /['";\\]/g.test(trimmedName)) {
      return { isValid: false, error: 'Name enthält ungültige Zeichen' }
    }

    // Whitespace-Only Namen verhindern
    if (!/[a-zA-ZäöüÄÖÜß]/.test(trimmedName)) {
      return { isValid: false, error: 'Name muss mindestens einen Buchstaben enthalten' }
    }

    // Prüfe auf doppelte Namen
    const existingPlayer = players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())
    if (existingPlayer) {
      return { isValid: false, error: 'Dieser Name existiert bereits' }
    }

    return { isValid: true }
  }, [players])

  const handleAddPlayer = useCallback(async (name: string) => {
    // Rate limiting check
    if (SecurityManager.isRateLimited('add_player', 5, 60000)) {
      throw new Error('Zu viele Versuche. Bitte warte eine Minute.')
    }

    const validation = validatePlayerName(name)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    try {
      // Enhanced sanitization
      const sanitizedName = SecurityManager.sanitizeUserInput(name)
      if (!SecurityManager.isSecureInput(sanitizedName)) {
        throw new Error('Ungültiger Name erkannt')
      }

      const newPlayer: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: sanitizedName,
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

  const contextValue = useMemo(() => ({
    players,
    addPlayer: handleAddPlayer,
    removePlayer: handleRemovePlayer,
    updatePlayerArenaPoints: handleUpdatePlayerArenaPoints,
    mode,
    loading
  }), [players, handleAddPlayer, handleRemovePlayer, handleUpdatePlayerArenaPoints, mode, loading])

  return (
    <PlayersContext.Provider value={contextValue}>
      {children}
    </PlayersContext.Provider>
  )
})