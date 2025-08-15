import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import styles from './LeaderboardScreen.module.css'
import { useAuth } from '@/context/AuthContext'
import { usePlayersContext } from '@/context/PlayersContext'

interface Player {
  id: string
  name: string
  arenaPoints: number
  rank: number
}

export function LeaderboardScreen() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()
  const { players: playersFromContext } = usePlayersContext()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()

    // Auto-refresh every 15 seconds (less frequent since we refresh on navigation)
    const interval = setInterval(() => {
      if (import.meta.env.DEV) {
        console.log('🔄 Auto-refresh Rangliste...')
      }
      loadLeaderboard()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  // Refresh leaderboard when navigating to this screen
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎯 Navigation zur Rangliste - automatische Aktualisierung...')
    }
    loadLeaderboard()
  }, [location.pathname])

  async function loadLeaderboard() {
    try {
      setLoading(true)

      // Load players from Firebase if available
      let firebasePlayers: Player[] = []

      try {
        const playersRef = collection(db, 'players')
        const q = query(playersRef, orderBy('arenaPoints', 'desc'), limit(50))
        const snapshot = await getDocs(q)

        snapshot.forEach((doc) => {
          const data = doc.data()
          const player = {
            id: doc.id,
            name: data.name || data.displayName || 'Unbekannter Spieler',
            arenaPoints: data.arenaPoints || 0,
            rank: 0 // Will be set later
          }
          firebasePlayers.push(player)
          if (import.meta.env.DEV) {
            console.log('🏆 Spieler geladen:', player.name, 'Punkte:', player.arenaPoints)
          }
        })

        if (import.meta.env.DEV) {
          console.log('📊 Gesamte Spielerliste aus Firebase:', firebasePlayers.length, 'Spieler')
        }
      } catch (firebaseError) {
        console.warn('Firebase nicht verfügbar, lade lokale Legenden:', firebaseError)
      }

      // Combine Firebase data with players from PlayersContext
      // Ensure no duplicate players based on name (case-insensitive)
      const combinedPlayers = [...firebasePlayers]
      playersFromContext.forEach((contextPlayer) => {
        const isAlreadyInFirebase = firebasePlayers.some(firebasePlayer => 
          firebasePlayer.name.toLowerCase() === contextPlayer.name.toLowerCase()
        )
        if (!isAlreadyInFirebase) {
          combinedPlayers.push({
            id: contextPlayer.id,
            name: contextPlayer.name,
            arenaPoints: contextPlayer.arenaPoints || 0, // Use points from context if available
            rank: 0
          })
        }
      })

      // Sort by arena points (descending) and assign ranks
      combinedPlayers.sort((a, b) => b.arenaPoints - a.arenaPoints)
      combinedPlayers.forEach((player, index) => {
        player.rank = index + 1
      })

      if (import.meta.env.DEV) {
        console.log('🏁 Finale Rangliste:', combinedPlayers.map(p => `${p.rank}. ${p.name}: ${p.arenaPoints} Punkte`))
      }
      setPlayers(combinedPlayers)
    } catch (error) {
      console.error('Fehler beim Laden der Rangliste:', error)
    } finally {
      setLoading(false)
    }
  }

  function getMedalIcon(rank: number): string {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return ''
    }
  }

  function getRankDisplay(rank: number): string {
    if (rank <= 3) return ''
    return `${rank}.`
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {t('leaderboard.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          🏆 {t('leaderboard.title')} 🏆
        </h1>

        <div style={{
          background: 'linear-gradient(135deg, rgba(218,165,32,0.2), rgba(255,215,0,0.1))',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(218,165,32,0.3)',
          marginBottom: '1rem'
        }}>
          <p className={styles.subtitle}>
            {t('leaderboard.subtitle')}
          </p>
          <div style={{
            color: 'var(--ancient-bronze)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            marginTop: '0.5rem'
          }}>
            ⚡ Automatische Updates bei Navigation & alle 15 Sekunden
          </div>
        </div>
      </header>

      <div className={styles.leaderboard}>
        {players.length === 0 ? (
          <div className={styles.empty}>
            {t('leaderboard.empty')}
          </div>
        ) : (
          players.map((player) => (
            <div 
              key={player.id} 
              className={`${styles.playerRow} ${player.rank <= 3 ? styles.topThree : ''}`}
            >
              <div className={styles.rankSection}>
                <span className={styles.medal}>
                  {getMedalIcon(player.rank)}
                </span>
                <span className={styles.rank}>
                  {getRankDisplay(player.rank)}
                </span>
              </div>

              <div className={styles.playerInfo}>
                <span className={styles.playerName}>
                  {player.name}
                </span>
              </div>

              <div className={styles.points}>
                <span className={styles.pointsNumber}>
                  {player.arenaPoints}
                </span>
                <span className={styles.pointsLabel}>
                  {t('leaderboard.points')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <div style={{
          color: 'var(--ancient-bronze)',
          fontSize: '0.9rem',
          fontStyle: 'italic',
          marginTop: '2rem'
        }}>
          🎯 Arena-Punkte werden automatisch synchronisiert
        </div>
      </div>
    </div>
  )
}