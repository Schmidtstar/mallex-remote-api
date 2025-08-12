import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import styles from './LeaderboardScreen.module.css'

interface Player {
  id: string
  name: string
  arenaPoints: number
  rank: number
}

export function LeaderboardScreen() {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    try {
      setLoading(true)
      
      // Load players from Firebase if available
      let playersData: Player[] = []
      
      try {
        const playersRef = collection(db, 'players')
        const q = query(playersRef, orderBy('arenaPoints', 'desc'), limit(50))
        const snapshot = await getDocs(q)

        snapshot.forEach((doc) => {
          const data = doc.data()
          playersData.push({
            id: doc.id,
            name: data.name || data.displayName || 'Unbekannter Spieler',
            arenaPoints: data.arenaPoints || 0,
            rank: 0 // Will be set later
          })
        })
      } catch (firebaseError) {
        console.warn('Firebase nicht verfügbar, lade lokale Legenden:', firebaseError)
      }

      // Also load legends from localStorage (they should appear with 0 points if not in Firebase)
      try {
        const localLegends = localStorage.getItem('mallex-players')
        if (localLegends) {
          const legends = JSON.parse(localLegends)
          legends.forEach((legend: any) => {
            // Check if this legend is already in the players data
            const existingPlayer = playersData.find(p => 
              p.name.toLowerCase() === legend.name.toLowerCase()
            )
            
            if (!existingPlayer) {
              // Add legend with 0 arena points
              playersData.push({
                id: legend.id,
                name: legend.name,
                arenaPoints: 0,
                rank: 0 // Will be set later
              })
            }
          })
        }
      } catch (localError) {
        console.warn('Fehler beim Laden der lokalen Legenden:', localError)
      }

      // Sort by arena points (descending) and assign ranks
      playersData.sort((a, b) => b.arenaPoints - a.arenaPoints)
      playersData.forEach((player, index) => {
        player.rank = index + 1
      })

      setPlayers(playersData)
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
          🏆 {t('leaderboard.title')}
        </h1>
        <p className={styles.subtitle}>
          {t('leaderboard.subtitle')}
        </p>
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
        <button 
          onClick={loadLeaderboard}
          className={styles.refreshButton}
        >
          {t('leaderboard.refresh')}
        </button>
      </div>
    </div>
  )
}