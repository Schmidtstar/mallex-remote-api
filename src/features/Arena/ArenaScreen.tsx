import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useCategories } from './categories'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '../../hooks/useSwipe'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickWithoutRepeat<T>(arr: T[], lastPicked: T): T {
  if (arr.length <= 1) return pick(arr)

  let picked = pick(arr)
  while (picked === lastPicked) {
    picked = pick(arr)
  }
  return picked
}

export default function ArenaScreen() {
  const { t } = useTranslation()
  const categories = useCategories()

  const [catId, setCatId] = useState(categories[0].id)
  const current = useMemo(() => categories.find(c => c.id === catId)!, [catId, categories])
  const [item, setItem] = useState(() => pick(current.items))

  // New states for timer and history
  const [lastChallenge, setLastChallenge] = useState<string>('')
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false)
  const [timeLeft, setTimeLeft] = useState<number>(30)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [challengeHistory, setChallengeHistory] = useState<Array<{category: string, challenge: string, timestamp: number}>>([])

  // Load challenge history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mallex_challenge_history')
    if (saved) {
      try {
        setChallengeHistory(JSON.parse(saved))
      } catch (e) {
        console.warn('Failed to load challenge history:', e)
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            return 30 // Reset timer
          }
          return prev - 1
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsTimerRunning(false) // Stop timer if it reaches 0
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timeLeft])

  const saveToHistory = useCallback((category: string, challenge: string) => {
    const newEntry = {
      category,
      challenge,
      timestamp: Date.now()
    }

    const newHistory = [newEntry, ...challengeHistory].slice(0, 5) // Keep only last 5
    setChallengeHistory(newHistory)
    localStorage.setItem('mallex_challenge_history', JSON.stringify(newHistory))
  }, [challengeHistory])

  const generateNewChallenge = () => {
    if (!catId) return

    const challenges = categories.find(c => c.id === catId)?.items || []
    if (challenges.length === 0) return

    const newChallenge = pickWithoutRepeat(challenges, lastChallenge)
    setItem(newChallenge)
    setLastChallenge(newChallenge)

    // Save to history
    saveToHistory(catId, newChallenge)

    // Start timer if enabled
    if (timerEnabled) {
      setTimeLeft(30)
      setIsTimerRunning(true)
    }
  }

  useEffect(() => { setItem(pick(current.items)) }, [current])

  const swipe = useSwipe<HTMLDivElement>({
    onSwipeLeft: generateNewChallenge,
    onSwipeRight: generateNewChallenge,
    stopPropagation: true  // don't bubble to TabLayout
  })

  return (
    <section style={styles.container}>
      <div style={styles.content}>
        <h1>{t('arena.title')}</h1>
        <div style={styles.categorySection}>
          <h3>{t('arena.selectCategory')}</h3>
          <div style={styles.categoryGrid}>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                style={{
                  ...styles.categoryButton,
                  ...(catId === c.id ? styles.selectedButton : {})
                }}
              >
                {t(`categories.${c.id}`)}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.timerSection}>
          <label style={styles.timerToggle}>
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(e) => {
                setTimerEnabled(e.target.checked)
                if (!e.target.checked && isTimerRunning) {
                  setIsTimerRunning(false)
                  setTimeLeft(30) // Reset timer when disabled
                }
              }}
            />
            {t('arena.enableTimer')}
          </label>

          {timerEnabled && (
            <div style={styles.timerDisplay}>
              <div style={styles.timerBar}>
                <div
                  style={{
                    ...styles.timerProgress,
                    width: `${(timeLeft / 30) * 100}%`
                  }}
                />
              </div>
              <span style={styles.timerText}>{timeLeft}s</span>
            </div>
          )}
        </div>

        <div className="card glass" style={styles.challengeCard} {...swipe}>
          <p style={{ minHeight: 64, display:'flex', alignItems:'center' }}>{item}</p>
          <small style={{opacity:.7}}>{t('arena.tip')}</small>
        </div>

        <button onClick={generateNewChallenge} style={styles.generateButton}>
          {t('arena.new')}
        </button>

        {challengeHistory.length > 0 && (
          <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h3>{t('arena.history')}</h3>
            <ul style={{ paddingLeft: '1.25rem' }}>
              {challengeHistory.map((entry, index) => (
                <li key={index} style={{ color: 'white', opacity: 0.8, marginBottom: '0.5rem' }}>
                  {entry.category} - {entry.challenge} ({new Date(entry.timestamp).toLocaleTimeString()})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
    paddingBottom: '6rem'
  },
  content: {
    maxWidth: '400px',
    margin: '0 auto'
  },
  categorySection: {
    marginBottom: '2rem'
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  categoryButton: {
    padding: '0.75rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  selectedButton: {
    background: 'rgba(255,255,255,0.3)',
    transform: 'scale(1.05)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  timerSection: {
    marginBottom: '2rem',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  timerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'white',
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  timerDisplay: {
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  timerBar: {
    flex: 1,
    height: '8px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  timerProgress: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff6b6b, #ee5a24)',
    transition: 'width 1s linear',
    borderRadius: '4px'
  },
  timerText: {
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    minWidth: '30px'
  },
  challengeCard: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(15px)',
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center' as const,
    color: 'white',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    lineHeight: '1.6',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  generateButton: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
    backdropFilter: 'blur(10px)'
  }
}