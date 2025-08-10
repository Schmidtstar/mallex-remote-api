
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePlayers } from '../../context/PlayersContext'
import { categories } from './categories'

type RevealState = 'idle' | 'revealing-player' | 'revealing-category' | 'revealing-challenge' | 'complete'

export default function ArenaScreen() {
  const { t } = useTranslation()
  const { players } = usePlayers()
  const [revealState, setRevealState] = useState<RevealState>('idle')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedChallenge, setSelectedChallenge] = useState<string>('')

  const startReveal = async () => {
    if (players.length === 0) return
    
    setRevealState('revealing-player')
    
    // Select random player
    const randomPlayer = players[Math.floor(Math.random() * players.length)]
    setSelectedPlayer(randomPlayer)
    
    setTimeout(() => {
      setRevealState('revealing-category')
      
      // Select random category
      const categoryKeys = Object.keys(categories)
      const randomCategoryKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)]
      setSelectedCategory(randomCategoryKey)
      
      setTimeout(() => {
        setRevealState('revealing-challenge')
        
        // Select random challenge from category
        const challenges = categories[randomCategoryKey as keyof typeof categories]
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]
        setSelectedChallenge(randomChallenge)
        
        setTimeout(() => {
          setRevealState('complete')
        }, 800)
      }, 800)
    }, 800)
  }

  const reset = () => {
    setRevealState('idle')
    setSelectedPlayer('')
    setSelectedCategory('')
    setSelectedChallenge('')
  }

  if (players.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🏛️ {t('arena.title')}</h1>
        <div style={{ marginTop: '40px' }}>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>
            {t('arena.empty.description')}
          </p>
          <Link
            to="/legends"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px'
            }}
          >
            {t('arena.empty.cta')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>⚔️ {t('arena.title')}</h1>
      
      <div style={{ marginTop: '40px', minHeight: '300px' }}>
        {revealState === 'idle' && (
          <div>
            <p style={{ fontSize: '18px', marginBottom: '30px' }}>
              {t('arena.ready', { count: players.length })}
            </p>
            <button
              onClick={startReveal}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#ff6b35',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {t('arena.start')}
            </button>
          </div>
        )}

        {revealState === 'revealing-player' && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
              {t('arena.revealing.player')}
            </h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b35' }}>
              {selectedPlayer}
            </div>
          </div>
        )}

        {(revealState === 'revealing-category' || revealState === 'revealing-challenge' || revealState === 'complete') && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
              {t('arena.player')}: <span style={{ color: '#ff6b35' }}>{selectedPlayer}</span>
            </h2>
            {revealState === 'revealing-category' && (
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
                  {t('arena.revealing.category')}
                </h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {t(`categories.${selectedCategory}`)}
                </div>
              </div>
            )}
          </div>
        )}

        {(revealState === 'revealing-challenge' || revealState === 'complete') && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
              {t('arena.category')}: <span style={{ color: '#4CAF50' }}>{t(`categories.${selectedCategory}`)}</span>
            </h3>
            {revealState === 'revealing-challenge' && (
              <div>
                <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>
                  {t('arena.revealing.challenge')}
                </h4>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9c27b0' }}>
                  {selectedChallenge.includes('{name}') 
                    ? selectedChallenge.replace('{name}', selectedPlayer)
                    : selectedChallenge
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {revealState === 'complete' && (
          <div style={{ marginTop: '30px' }}>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>
                {t('arena.challenge')}:
              </h4>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9c27b0' }}>
                {selectedChallenge.includes('{name}') 
                  ? selectedChallenge.replace('{name}', selectedPlayer)
                  : selectedChallenge
                }
              </div>
            </div>
            <button
              onClick={reset}
              style={{
                padding: '12px 25px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {t('arena.newChallenge')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
