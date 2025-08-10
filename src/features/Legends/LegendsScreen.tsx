
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayers } from '../../context/PlayersContext'

export default function LegendsScreen() {
  const { t } = useTranslation()
  const { players, addPlayer, removePlayer } = usePlayers()
  const [newPlayerName, setNewPlayerName] = useState('')

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim())
      setNewPlayerName('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer()
    }
  }

  return (
    <div style={styles.container}>
      <section style={styles.content}>
        <h1 style={styles.title}>{t('legends.title')}</h1>
        <p style={styles.subtitle}>{t('legends.subtitle')}</p>

        <div style={styles.addPlayerSection}>
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('legends.playerName')}
            style={styles.playerInput}
          />
          <button 
            onClick={handleAddPlayer}
            style={styles.addButton}
            disabled={!newPlayerName.trim()}
          >
            {t('legends.addPlayer')}
          </button>
        </div>

        {players.length === 0 ? (
          <div style={styles.emptyState}>
            <p>{t('legends.noPlayers')}</p>
          </div>
        ) : (
          <div style={styles.playersList}>
            {players.map((player, index) => (
              <div key={index} style={styles.playerCard}>
                <span style={styles.playerName}>{player}</span>
                <button
                  onClick={() => removePlayer(player)}
                  style={styles.removeButton}
                  aria-label={t('legends.removePlayer')}
                >
                  ⚔️
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 50%, #d4af37 100%)',
    padding: '1rem',
    paddingBottom: '6rem'
  },
  content: {
    maxWidth: '400px',
    margin: '0 auto',
    color: 'white'
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '0.5rem',
    fontSize: '2rem',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  subtitle: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
    opacity: 0.9,
    fontSize: '0.9rem'
  },
  addPlayerSection: {
    marginBottom: '2rem',
    display: 'flex',
    gap: '1rem'
  },
  playerInput: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '12px',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
    '::placeholder': {
      color: 'rgba(255,255,255,0.6)'
    }
  } as React.CSSProperties,
  addButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(45deg, #d4af37, #ffd700)',
    color: '#4a148c',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    marginTop: '3rem',
    padding: '2rem',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '2px solid rgba(212, 175, 55, 0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  },
  playerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(15px)',
    borderRadius: '16px',
    padding: '1rem',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease'
  },
  playerName: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    flex: 1
  },
  removeButton: {
    background: 'rgba(220, 20, 60, 0.8)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
  }
}
