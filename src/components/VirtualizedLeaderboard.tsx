import React, { memo, useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'

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

const PlayerRow = memo(({ index, style, data }: any) => {
  const player = data[index]

  const getMedalIcon = useCallback((rank: number): string => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈' 
      case 3: return '🥉'
      default: return ''
    }
  }, [])

  return (
    <div style={style} className="leaderboard-row">
      <div className="rank-display">
        {getMedalIcon(player.rank) || `${player.rank}.`}
      </div>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-points">{player.arenaPoints} Punkte</span>
      </div>
    </div>
  )
})

PlayerRow.displayName = 'PlayerRow'

export const VirtualizedLeaderboard = memo(({ players, loading }: VirtualizedLeaderboardProps) => {
  const memoizedPlayers = useMemo(() => players, [players])

  if (loading) {
    return <div className="loading-state">Lade Rangliste...</div>
  }

  if (memoizedPlayers.length === 0) {
    return <div className="empty-state">Keine Spieler gefunden</div>
  }

  return (
    <div className="virtualized-leaderboard" style={{ height: '400px' }}>
      <List
        height={400}
        itemCount={memoizedPlayers.length}
        itemSize={60}
        itemData={memoizedPlayers}
        overscanCount={5}
      >
        {PlayerRow}
      </List>
    </div>
  )
})

VirtualizedLeaderboard.displayName = 'VirtualizedLeaderboard'