
import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { categories as categoriesMap } from '../../Arena/categories'
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext'

export default function SuggestTab() {
  const { t } = useTranslation()
  const { addSuggestion } = useTaskSuggestions()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('fate')
  const [taskText, setTaskText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)

  // Turn categories object into an array
  const categoryList = useMemo(
    () =>
      Object.entries(categoriesMap).map(([id, labelKey]) => ({
        id,
        labelKey: String(labelKey),
      })),
    []
  )

  const handleSubmit = async () => {
    if (taskText.trim().length < 10) {
      return
    }

    setIsSubmitting(true)
    try {
      await addSuggestion(selectedCategory, taskText.trim())
      setTaskText('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2>{t('menu.suggest.title')}</h2>

      {submitted && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          border: '1px solid rgba(76, 175, 80, 0.5)',
          borderRadius: '8px',
          color: '#4CAF50',
          textAlign: 'center',
          fontWeight: 500
        }}>
          ✅ {t('menu.suggest.thanks')}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500 }}>
          {t('menu.suggest.choose')}:
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--glass)',
            color: 'var(--fg)',
            border: '1px solid var(--stroke)',
            fontSize: '14px'
          }}
        >
          {categoryList.map((category) => (
            <option key={category.id} value={category.id}>
              {t(category.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500 }}>
          Aufgabe (min. 10 Zeichen):
        </label>
        <textarea
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder={t('menu.suggest.placeholder')}
          rows={4}
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--glass)',
            color: 'var(--fg)',
            border: '1px solid var(--stroke)',
            fontSize: '14px',
            resize: 'vertical',
            minHeight: '100px'
          }}
        />
        <div style={{ 
          fontSize: '12px', 
          color: taskText.length >= 10 ? '#4CAF50' : 'rgba(255,255,255,0.6)' 
        }}>
          {taskText.length} / 10
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={taskText.trim().length < 10 || isSubmitting}
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          backgroundColor: taskText.trim().length >= 10 && !isSubmitting ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
          color: taskText.trim().length >= 10 && !isSubmitting ? 'var(--bg)' : 'rgba(255,255,255,0.5)',
          border: 'none',
          cursor: taskText.trim().length >= 10 && !isSubmitting ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          fontWeight: 600,
          transition: 'all 0.2s ease'
        }}
      >
        {isSubmitting ? 'Sende...' : t('menu.suggest.submit')}
      </button>
    </div>
  )
}
