import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categories } from '../../Arena/categories'
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext'

export function SuggestTab() {
  const { t } = useTranslation()
  const { addSuggestion } = useTaskSuggestions()
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)
  const [taskText, setTaskText] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const success = addSuggestion(selectedCategory, taskText)

    if (success) {
      setTaskText('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } else {
      if (taskText.trim().length < 8) {
        setError('Aufgabe muss mindestens 8 Zeichen haben')
      } else {
        setError('Diese Aufgabe wurde bereits vorgeschlagen')
      }
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--fg)', marginBottom: '1.5rem' }}>
        {t('menu.suggest.title')}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Category Select */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            color: 'var(--fg)',
            marginBottom: '8px',
            fontSize: '0.9rem'
          }}>
            {t('menu.suggest.choose')}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--glass)',
              border: '1px solid var(--stroke)',
              borderRadius: 'var(--radius)',
              color: 'var(--fg)',
              fontSize: '1rem'
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {t(category.labelKey, category.id)}
              </option>
            ))}
          </select>
        </div>

        {/* Task Text */}
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder={t('menu.suggest.placeholder')}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--glass)',
              border: '1px solid var(--stroke)',
              borderRadius: 'var(--radius)',
              color: 'var(--fg)',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
          {error && (
            <div style={{ color: '#ff6b6b', fontSize: '0.9rem', marginTop: '4px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={taskText.trim().length < 8}
          style={{
            padding: '12px 24px',
            background: taskText.trim().length >= 8 ? 'var(--primary)' : 'var(--glass)',
            color: taskText.trim().length >= 8 ? 'var(--bg)' : 'var(--fg)',
            border: '1px solid var(--stroke)',
            borderRadius: 'var(--radius)',
            cursor: taskText.trim().length >= 8 ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            opacity: taskText.trim().length >= 8 ? 1 : 0.5
          }}
        >
          {t('menu.suggest.submit')}
        </button>
      </form>

      {/* Success Message */}
      {showSuccess && (
        <div style={{
          marginTop: '1rem',
          padding: '12px',
          background: 'rgba(107, 213, 255, 0.1)',
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius)',
          color: 'var(--primary)'
        }}>
          {t('menu.suggest.thanks')}
        </div>
      )}
    </div>
  )
}