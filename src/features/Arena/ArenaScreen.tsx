import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { categories } from './categories'
import { challenges } from './challenges'
import { fetchApprovedTasksByCategory } from '../../lib/tasksApi'
import { useSwipe } from '../../hooks/useSwipe'
import styles from '../../layouts/TabLayout.module.css'

export function ArenaScreen() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [firestoreTasks, setFirestoreTasks] = useState<string[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  const loadFirestoreTasks = async (category: string) => {
    setLoadingTasks(true)
    try {
      const tasks = await fetchApprovedTasksByCategory(category as any)
      setFirestoreTasks(tasks.map(task => task.text))
    } catch (error) {
      console.error('Error loading Firestore tasks:', error)
      setFirestoreTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  const getRandomChallenge = () => {
    const staticTasks = challenges[selectedCategory] || []
    const allTasks = [...staticTasks, ...firestoreTasks]

    if (allTasks.length === 0) return null

    const randomIndex = Math.floor(Math.random() * allTasks.length)
    const selectedTask = allTasks[randomIndex]

    // If it's a static task (i18n key), translate it. Otherwise, use as-is (Firestore text)
    return staticTasks.includes(selectedTask) ? t(selectedTask) : selectedTask
  }

  const handleNewChallenge = () => {
    const challenge = getRandomChallenge()
    setCurrentChallenge(challenge)
    setIsRevealed(false)
  }

  const handleReveal = () => {
    setIsRevealed(true)
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentChallenge(null)
    setIsRevealed(false)
    loadFirestoreTasks(categoryId)
  }

  useEffect(() => {
    loadFirestoreTasks(selectedCategory)
  }, [])

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

      <div className={styles.categorySelector}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`${styles.categoryButton} ${
              selectedCategory === category.id ? styles.active : ''
            }`}
          >
            {t(category.labelKey)}
          </button>
        ))}
      </div>

      <div className={styles.challengeCard}>
        {loadingTasks ? (
          <p className={styles.noChallengeText}>Lade Aufgaben...</p>
        ) : currentChallenge ? (
          <div className={styles.challengeContent}>
            <p className={`${styles.challengeText} ${isRevealed ? styles.revealed : ''}`}>
              {isRevealed ? currentChallenge : '***'}
            </p>
            {!isRevealed && (
              <button onClick={handleReveal} className={styles.revealButton}>
                Aufgabe anzeigen
              </button>
            )}
          </div>
        ) : (
          <p className={styles.noChallengeText}>Wähle "Neue Aufgabe" um zu beginnen</p>
        )}
      </div>

      <button
        onClick={handleNewChallenge}
        style={{
          padding: '16px 32px',
          fontSize: '1.2rem',
          background: 'var(--primary)',
          color: 'var(--bg)',
          border: 'none',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          marginTop: '2rem'
        }}
      >
        Neue Aufgabe
      </button>
    </div>
  )
}