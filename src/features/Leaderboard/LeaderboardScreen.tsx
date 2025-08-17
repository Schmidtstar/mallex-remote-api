import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './LeaderboardScreen.module.css'
import { useAuth } from '@/context/AuthContext'
import { usePlayersContext } from '@/context/PlayersContext'
import { VirtualizedLeaderboard } from '@/components/VirtualizedLeaderboard'

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
  const { players: playersFromContext, loading: playersLoading } = usePlayersContext()
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    // PlayersContext ist bereits die Single Source of Truth mit Real-time Updates
    const playersWithRanks = playersFromContext
      .map(player => ({
        id: player.id,
        name: player.name,
        arenaPoints: player.arenaPoints || 0,
        rank: 0
      }))
      .sort((a, b) => b.arenaPoints - a.arenaPoints)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }))

    setPlayers(playersWithRanks)

    if (import.meta.env.DEV) {
      console.log('🏁 Rangliste aktualisiert (Real-time):', playersWithRanks.map(p => `${p.rank}. ${p.name}: ${p.arenaPoints} Punkte`))
    }
  }, [playersFromContext])

  // Navigation-basierte Aktualisierung (falls nötig)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎯 Navigation zur Rangliste')
    }
  }, [location.pathname])

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

  if (playersLoading) {
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
            ⚡ Live-Updates durch Real-time Firebase Sync
          </div>
        </div>
      </header>

      <VirtualizedLeaderboard 
        players={players} 
        loading={playersLoading}
      />

      <div className={styles.footer}>
        <div style={{
          color: 'var(--ancient-bronze)',
          fontSize: '0.9rem',
          fontStyle: 'italic',
          marginTop: '2rem'
        }}>
          🎯 Live-Updates ohne manuelle Aktualisierung
        </div>
      </div>
    </div>
  )
}