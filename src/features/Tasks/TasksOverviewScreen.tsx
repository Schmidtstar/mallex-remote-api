import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { categories } from '../Arena/categories'
import { challenges } from '../Arena/challenges'
import styles from './TasksOverviewScreen.module.css'
import { fetchApprovedTasksByCategory } from '../services/tasksApiService' // Assuming this import

export function TasksOverviewScreen() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
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

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    loadFirestoreTasks(categoryId)
  }

  useEffect(() => {
    loadFirestoreTasks(selectedCategory)
  }, [])

  const staticTasks = challenges[selectedCategory] || []
  const allTasks = [...staticTasks, ...firestoreTasks]

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
  }

  const getTasksForCategory = (categoryId: string): string[] => {
    return challenges[categoryId] || []
  }

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('tasks.title')}</h1>
      </div>

      {!selectedCategory ? (
        <div className={styles.content}>
          <h2 className={styles.subtitle}>{t('tasks.selectCategory')}</h2>
          <div className={styles.grid}>
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
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.backButtonContainer}>
            <button
              onClick={handleBackToCategories}
              className={styles.backButton}
              aria-label={t('tasks.backToCategories')}
            >
              ← {t('tasks.backToCategories')}
            </button>
          </div>

          <h2 className={styles.subtitle}>
            {selectedCategoryData && t('tasks.categoryTasks', {
              category: t(selectedCategoryData.labelKey)
            })}
          </h2>
          
          <div className={styles.statsCard}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>
                {loadingTasks ? '...' : allTasks.length}
              </div>
              <div className={styles.statLabel}>{t('tasks.totalTasks')}</div>
            </div>
          </div>

          <div className={styles.tasksList}>
            {loadingTasks ? (
              <div className={styles.emptyState}>
                <p>Lade Aufgaben...</p>
              </div>
            ) : allTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <p>{t('tasks.noTasks')}</p>
              </div>
            ) : (
              allTasks.map((task, index) => (
                <div key={index} className={styles.taskCard}>
                  <div className={styles.taskNumber}>{index + 1}</div>
                  <div className={styles.taskText}>
                    {staticTasks.includes(task) ? t(task) : task}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}