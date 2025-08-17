import React, { memo, useMemo, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useTranslation } from 'react-i18next'
import styles from '../features/Leaderboard/LeaderboardScreen.module.css'
import { performanceMonitor } from '../lib/performance-monitor'

interface Player {
  id: string
  name: string
  arenaPoints: number
  rank: number
}

interface VirtualizedLeaderboardProps {
  players: Player[]
  loading: boolean
}

// Memoized Player Row für Performance
const PlayerRow = memo(({ index, style, data }: { index: number, style: any, data: Player[] }) => {
  const { t } = useTranslation()
  const player = data[index]

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

  return (
    <div 
      style={style}
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
  )
})

PlayerRow.displayName = 'PlayerRow'

export const VirtualizedLeaderboard: React.FC<VirtualizedLeaderboardProps> = memo(({ players, loading }) => {
  const { t } = useTranslation()

  // Optimierte Player-Liste mit Ranking
  const rankedPlayers = useMemo(() => {
    performanceMonitor.startRenderMeasure('leaderboard-ranking');

    const ranked = players
      .sort((a, b) => b.arenaPoints - a.arenaPoints)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    performanceMonitor.endRenderMeasure('leaderboard-ranking', ranked.length);
    return ranked;
  }, [players])

  // Performance logging für große Listen
  useEffect(() => {
    if (rankedPlayers.length > 50 && import.meta.env.DEV) {
      console.log(`📊 Virtual Scrolling aktiviert für ${rankedPlayers.length} Spieler`);

      const avgMetrics = performanceMonitor.getAverageMetrics();
      if (avgMetrics) {
        console.log('📈 Performance-Durchschnitt:', {
          renderTime: `${avgMetrics.renderTime.toFixed(2)}ms`,
          memory: `${avgMetrics.memoryUsage.toFixed(1)}MB`,
          performance: `${avgMetrics.scrollPerformance.toFixed(1)}%`
        });
      }
    }
  }, [rankedPlayers.length])

  if (loading) {
    return (
      <div className={styles.loading}>
        {t('leaderboard.loading')}
      </div>
    )
  }

  if (rankedPlayers.length === 0) {
    return (
      <div className={styles.empty}>
        {t('leaderboard.empty')}
      </div>
    )
  }

  // Dynamische Höhe basierend auf Viewport
  const containerHeight = Math.min(600, window.innerHeight * 0.6)
  const itemHeight = 80 // Höhe pro Player Row

  return (
    <div className={styles.leaderboard} style={{ height: containerHeight }}>
      <List
        height={containerHeight}
        itemCount={rankedPlayers.length}
        itemSize={itemHeight}
        itemData={rankedPlayers}
        overscanCount={5} // Performance: 5 Items vorrendern
        style={{
          background: 'var(--glass-background)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: 'var(--radius-large)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-marble)'
        }}
      >
        {PlayerRow}
      </List>

      {/* Performance Info für Dev */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          🚀 Virtual: {rankedPlayers.length} Spieler
        </div>
      )}
    </div>
  )
})

VirtualizedLeaderboard.displayName = 'VirtualizedLeaderboard'