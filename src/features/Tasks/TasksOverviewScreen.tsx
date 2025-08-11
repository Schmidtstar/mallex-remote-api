
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categories } from '../Arena/categories'
import { challenges } from '../Arena/challenges'
import styles from './TasksOverviewScreen.module.css'

export function TasksOverviewScreen() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
                onClick={() => handleCategorySelect(category.id)}
                className={styles.categoryCard}
                aria-label={t(category.labelKey)}
              >
                <span className={styles.categoryLabel}>
                  {t(category.labelKey)}
                </span>
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
          
          <div className={styles.tasksList}>
            {getTasksForCategory(selectedCategory).map((taskKey, index) => (
              <div key={index} className={styles.taskCard}>
                <p className={styles.taskText}>
                  {t(taskKey, taskKey)}
                </p>
              </div>
            ))}
            {getTasksForCategory(selectedCategory).length === 0 && (
              <div className={styles.noTasks}>
                {t('tasks.noTasks')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
