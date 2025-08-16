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

      // Nutze PlayersContext als HAUPT-Quelle (hat bereits Firebase sync)
      const contextPlayersWithPoints = playersFromContext.map(player => ({
        id: player.id,
        name: player.name,
        arenaPoints: player.arenaPoints || 0,
        rank: 0
      }))

      // Sortiere nach Arena-Punkten und weise Ränge zu
      contextPlayersWithPoints.sort((a, b) => b.arenaPoints - a.arenaPoints)
      contextPlayersWithPoints.forEach((player, index) => {
        player.rank = index + 1
      })

      if (import.meta.env.DEV) {
        console.log('🏁 Finale Rangliste (PlayersContext):', contextPlayersWithPoints.map(p => `${p.rank}. ${p.name}: ${p.arenaPoints} Punkte`))
      }
      
      setPlayers(contextPlayersWithPoints)
    } catch (error) {
      console.error('❌ Fehler beim Laden der Rangliste:', error)
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