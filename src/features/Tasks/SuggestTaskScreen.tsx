
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTaskSuggestions } from '../../context/TaskSuggestionsContext'
import { useAuth } from '../../context/AuthContext'
import { categories } from '../Arena/categories'
import styles from './SuggestTaskScreen.module.css'

export function SuggestTaskScreen() {
  const { t } = useTranslation()
  const { add } = useTaskSuggestions()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [taskText, setTaskText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThanks, setShowThanks] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory || !taskText.trim()) return

    setIsSubmitting(true)
    try {
      const author = user ? { uid: user.uid, email: user.email } : undefined
      add(selectedCategory, taskText.trim(), author)
      
      // Reset form
      setSelectedCategory('')
      setTaskText('')
      setShowThanks(true)
      
      // Hide thanks message after 3 seconds
      setTimeout(() => setShowThanks(false), 3000)
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('suggest.title')}</h1>
      </div>

      {showThanks && (
        <div className={styles.thanksMessage}>
          {t('suggest.thanks')}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="category" className={styles.label}>
            {t('suggest.choose')}
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">{t('suggest.choose')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {t(category.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="taskText" className={styles.label}>
            {t('suggest.placeholder')}
          </label>
          <textarea
            id="taskText"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder={t('suggest.placeholder')}
            className={styles.textarea}
            rows={4}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedCategory || !taskText.trim()}
          className={styles.submitButton}
        >
          {isSubmitting ? t('common.loading', 'Loading...') : t('suggest.submit')}
        </button>
      </form>
    </div>
  )
}
