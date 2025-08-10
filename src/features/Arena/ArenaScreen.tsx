
import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayers } from '../../context/PlayersContext'
import { Link } from 'react-router-dom'

const categories = [
  { id: 'fate', challenges: [
    'Alle mit gerader Geburtstagszahl trinken 1 Schluck.',
    'Würfle dein Schicksal: Ziehe eine zweite Challenge.',
    'Die Person links von {name} trinkt 2 Schlucke.',
    '{name} wählt eine Person, die 3 Schlücke trinkt.',
    'Alle Männer trinken 2 Schlücke, {name} entscheidet.'
  ]},
  { id: 'seduce', challenges: [
    '{name} flüstert jemandem ein Kompliment ins Ohr.',
    '{name} hält 10 Sekunden lang intensiven Augenkontakt mit einer Person nach Wahl.',
    '{name} schickt einem Mitspieler ein Herz-Emoji.',
    '{name} gibt jemandem ein Kompliment über dessen Outfit.',
    '{name} erzählt von seinem ersten Kuss.'
  ]},
  { id: 'confess', challenges: [
    '{name} gesteht eine peinliche Chat-Autokorrektur.',
    '{name} beichtet eine schlechte Angewohnheit.',
    '{name} verrät, wen er zuletzt gestalkt hat.',
    '{name} erzählt sein peinlichstes Dating-Erlebnis.',
    '{name} gesteht eine Lüge, die er mal erzählt hat.'
  ]},
  { id: 'escalate', challenges: [
    'Alle trinken 1, {name} trinkt 2.',
    '{name} wechselt Sitzplatz mit einer Person nach Wahl.',
    '{name} nimmt die nächste Challenge sofort an – ohne zu lesen.',
    '{name} bestimmt, wer die nächste Runde zahlt.',
    '{name} startet einen Trinkspruch.'
  ]},
  { id: 'shame', challenges: [
    '{name} zeigt sein ältestes Foto im Handy (wenn okay) – sonst trinkt 2.',
    '{name} liest die letzte gesendete Nachricht vor (wenn okay) – sonst trinkt 2.',
    '{name} trägt für 1 Runde eine lustige Pose.',
    '{name} imitiert eine berühmte Person für 30 Sekunden.',
    '{name} macht 10 Liegestütze oder trinkt 3 Schlücke.'
  ]}
]

type GamePhase = 'idle' | 'player' | 'category' | 'challenge'

export default function ArenaScreen() {
  const { t } = useTranslation()
  const { players } = usePlayers()
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle')
  const [currentPlayer, setCurrentPlayer] = useState<string>('')
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [currentChallenge, setCurrentChallenge] = useState<string>('')

  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const startBattle = useCallback(() => {
    if (players.length === 0) return

    // Reset state
    setCurrentPlayer('')
    setCurrentCategory('')
    setCurrentChallenge('')
    
    // Phase 1: Reveal Player
    setGamePhase('player')
    setTimeout(() => {
      const selectedPlayer = pickRandom(players)
      setCurrentPlayer(selectedPlayer)
      
      // Phase 2: Reveal Category
      setTimeout(() => {
        setGamePhase('category')
        setTimeout(() => {
          const selectedCategory = pickRandom(categories)
          setCurrentCategory(selectedCategory.id)
          
          // Phase 3: Reveal Challenge
          setTimeout(() => {
            setGamePhase('challenge')
            setTimeout(() => {
              const challenge = pickRandom(selectedCategory.challenges)
              const interpolatedChallenge = challenge.replace(/\{name\}/g, selectedPlayer)
              setCurrentChallenge(interpolatedChallenge)
            }, 300)
          }, 1000)
        }, 300)
      }, 1200)
    }, 300)
  }, [players])

  const resetGame = () => {
    setGamePhase('idle')
    setCurrentPlayer('')
    setCurrentCategory('')
    setCurrentChallenge('')
  }

  if (players.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>{t('arena.title')}</h1>
          
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>{t('arena.noPlayers')}</p>
            <Link to="/legends" style={styles.ctaLink}>
              {t('arena.callToAction')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>{t('arena.title')}</h1>
        
        {gamePhase === 'idle' && (
          <div style={styles.startSection}>
            <button onClick={startBattle} style={styles.startButton}>
              {t('arena.start')}
            </button>
          </div>
        )}

        {gamePhase !== 'idle' && (
          <div style={styles.gameArea}>
            {/* Player Reveal */}
            <div style={{
              ...styles.revealCard,
              ...(gamePhase === 'player' ? styles.revealCardActive : {}),
              ...(currentPlayer ? styles.revealCardRevealed : {})
            }}>
              <h3 style={styles.revealLabel}>{t('arena.playerReveal')}</h3>
              <div style={styles.revealContent}>
                {currentPlayer ? (
                  <span style={styles.playerName}>{currentPlayer}</span>
                ) : (
                  <div style={styles.loadingDots}>...</div>
                )}
              </div>
            </div>

            {/* Category Reveal */}
            {gamePhase !== 'player' && (
              <div style={{
                ...styles.revealCard,
                ...(gamePhase === 'category' ? styles.revealCardActive : {}),
                ...(currentCategory ? styles.revealCardRevealed : {})
              }}>
                <h3 style={styles.revealLabel}>{t('arena.categoryReveal')}</h3>
                <div style={styles.revealContent}>
                  {currentCategory ? (
                    <span style={styles.categoryName}>
                      {t(`categories.${currentCategory}`)}
                    </span>
                  ) : (
                    <div style={styles.loadingDots}>...</div>
                  )}
                </div>
              </div>
            )}

            {/* Challenge Reveal */}
            {gamePhase === 'challenge' && (
              <div style={{
                ...styles.revealCard,
                ...(currentChallenge ? styles.revealCardRevealed : styles.revealCardActive)
              }}>
                <h3 style={styles.revealLabel}>{t('arena.challengeReveal')}</h3>
                <div style={styles.revealContent}>
                  {currentChallenge ? (
                    <p style={styles.challengeText}>{currentChallenge}</p>
                  ) : (
                    <div style={styles.loadingDots}>...</div>
                  )}
                </div>
              </div>
            )}

            {currentChallenge && (
              <button onClick={resetGame} style={styles.resetButton}>
                {t('arena.start')}
              </button>
            )}
          </div>
        )}
      </div>
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
    marginBottom: '2rem',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    textShadow: '3px 3px 6px rgba(0,0,0,0.7)',
    background: 'linear-gradient(45deg, #ffd700, #fff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  startSection: {
    textAlign: 'center' as const,
    marginTop: '4rem'
  },
  startButton: {
    padding: '1.5rem 3rem',
    background: 'linear-gradient(45deg, #d4af37, #ffd700)',
    color: '#4a148c',
    border: 'none',
    borderRadius: '16px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
    transform: 'scale(1)',
    ':hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 12px 40px rgba(212, 175, 55, 0.6)'
    }
  } as React.CSSProperties,
  gameArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem',
    marginTop: '2rem'
  },
  revealCard: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    padding: '2rem',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    transition: 'all 0.8s ease',
    opacity: 0.3,
    transform: 'translateY(20px)'
  },
  revealCardActive: {
    opacity: 1,
    transform: 'translateY(0) scale(1.02)',
    border: '2px solid rgba(212, 175, 55, 0.5)',
    animation: 'pulse 1s infinite'
  },
  revealCardRevealed: {
    opacity: 1,
    transform: 'translateY(0)',
    border: '2px solid rgba(212, 175, 55, 0.8)',
    background: 'rgba(255,255,255,0.2)',
    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.3)'
  },
  revealLabel: {
    textAlign: 'center' as const,
    fontSize: '1.2rem',
    marginBottom: '1rem',
    opacity: 0.8,
    textTransform: 'uppercase' as const,
    letterSpacing: '2px'
  },
  revealContent: {
    textAlign: 'center' as const,
    minHeight: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playerName: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  categoryName: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#ff6b6b',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  challengeText: {
    fontSize: '1.2rem',
    lineHeight: '1.6',
    textAlign: 'center' as const,
    margin: 0
  },
  loadingDots: {
    fontSize: '2rem',
    color: '#ffd700',
    animation: 'pulse 1s infinite'
  },
  resetButton: {
    alignSelf: 'center' as const,
    padding: '1rem 2rem',
    background: 'linear-gradient(45deg, #d4af37, #ffd700)',
    color: '#4a148c',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '2rem',
    transition: 'all 0.3s ease'
  },
  emptyState: {
    textAlign: 'center' as const,
    marginTop: '4rem',
    padding: '3rem 2rem',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '2px solid rgba(212, 175, 55, 0.3)'
  },
  emptyTitle: {
    fontSize: '1.5rem',
    marginBottom: '2rem',
    fontWeight: 'bold'
  },
  ctaLink: {
    display: 'inline-block',
    padding: '1rem 2rem',
    background: 'linear-gradient(45deg, #d4af37, #ffd700)',
    color: '#4a148c',
    textDecoration: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  }
}
