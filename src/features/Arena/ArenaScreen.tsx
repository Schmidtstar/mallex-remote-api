
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayers } from '../../context/PlayersContext'
import { categories } from './categories'
import { challenges } from './challenges'

export function ArenaScreen() {
  const { t } = useTranslation()
  const { players } = usePlayers()
  const [currentChallenge, setCurrentChallenge] = useState<{
    player: string
    category: string
    challenge: string
  } | null>(null)

  const handleStart = () => {
    if (players.length === 0) return

    // Random Player
    const randomPlayer = players[Math.floor(Math.random() * players.length)]
    
    // Random Category
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    
    // Random Challenge
    const categoryKeys = challenges[randomCategory.id]
    const randomChallenge = categoryKeys[Math.floor(Math.random() * categoryKeys.length)]

    setCurrentChallenge({
      player: randomPlayer,
      category: randomCategory.labelKey,
      challenge: randomChallenge
    })
  }

  return (
    <div style={{
      padding: '24px',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem', fontSize: '2.5rem' }}>
        MALLEX Arena
      </h1>
      
      {!currentChallenge ? (
        <button 
          onClick={handleStart}
          disabled={players.length === 0}
          style={{
            padding: '16px 32px',
            fontSize: '1.2rem',
            background: players.length === 0 ? 'var(--glass)' : 'var(--primary)',
            color: players.length === 0 ? 'var(--fg)' : 'var(--bg)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: players.length === 0 ? 'not-allowed' : 'pointer',
            opacity: players.length === 0 ? 0.5 : 1
          }}
        >
          {players.length === 0 ? 'Keine Spieler' : 'Start'}
        </button>
      ) : (
        <div style={{
          background: 'var(--glass)',
          border: '1px solid var(--stroke)',
          borderRadius: 'var(--radius)',
          padding: '2rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            {currentChallenge.player}
          </h2>
          <p style={{ 
            color: 'var(--fg)', 
            opacity: 0.7, 
            marginBottom: '1rem',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
            letterSpacing: '1px'
          }}>
            {t(currentChallenge.category, currentChallenge.category)}
          </p>
          <p style={{ 
            color: 'var(--fg)', 
            fontSize: '1.1rem',
            lineHeight: '1.5',
            marginBottom: '2rem'
          }}>
            {t(currentChallenge.challenge, currentChallenge.challenge)}
          </p>
          <button 
            onClick={() => setCurrentChallenge(null)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid var(--stroke)',
              borderRadius: 'var(--radius)',
              color: 'var(--fg)',
              cursor: 'pointer'
            }}
          >
            Neue Herausforderung
          </button>
        </div>
      )}
    </div>
  )
}
