import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ChallengeHistoryEntry {
  category: string
  challenge: string
  timestamp: number
}

export default function LegendsScreen() {
  const { t } = useTranslation()
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('mallex_challenge_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.warn('Failed to load challenge history:', e)
      }
    }
  }, [])

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days > 0) return t('legends.timeAgo', { time: `${days} Tag${days > 1 ? 'en' : ''}` })
    if (hours > 0) return t('legends.timeAgo', { time: `${hours} Stunde${hours > 1 ? 'n' : ''}` })
    if (minutes > 0) return t('legends.timeAgo', { time: `${minutes} Minute${minutes > 1 ? 'n' : ''}` })
    return t('legends.timeAgo', { time: 'wenigen Sekunden' })
  }

  return (
    <div style={styles.container}>
      <section style={styles.content}>
        <h1 style={styles.title}>{t('legends.title')}</h1>
        <p style={styles.subtitle}>{t('legends.subtitle')}</p>

        {history.length === 0 ? (
          <div style={styles.emptyState}>
            <p>{t('legends.noHistory')}</p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {history.map((entry, index) => (
              <div key={index} style={styles.historyCard}>
                <div style={styles.categoryBadge}>
                  {t(`categories.${entry.category}`, entry.category)}
                </div>
                <p style={styles.challengeText}>{entry.challenge}</p>
                <span style={styles.timeStamp}>
                  {formatTimeAgo(entry.timestamp)}
                </span>
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
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
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
    fontWeight: 'bold'
  },
  subtitle: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
    opacity: 0.8,
    fontSize: '0.9rem'
  },
  emptyState: {
    textAlign: 'center' as const,
    marginTop: '3rem',
    padding: '2rem',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  },
  historyCard: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(15px)',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    position: 'relative' as const
  },
  categoryBadge: {
    display: 'inline-block',
    background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  challengeText: {
    fontSize: '0.95rem',
    lineHeight: '1.5',
    marginBottom: '1rem',
    opacity: 0.9
  },
  timeStamp: {
    fontSize: '0.8rem',
    opacity: 0.6,
    position: 'absolute' as const,
    bottom: '0.75rem',
    right: '1rem'
  }
}