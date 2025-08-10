import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext'
import { categories } from '../../Arena/categories'

export function AdminTab() {
  const { t } = useTranslation()
  const { pending, approve, reject, localAdmin, toggleLocalAdmin } = useTaskSuggestions()
  const [notes, setNotes] = useState<Record<string, string>>({})

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? t(category.labelKey, categoryId) : categoryId
  }

  const handleNote = (suggestionId: string, note: string) => {
    setNotes(prev => ({ ...prev, [suggestionId]: note }))
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem' 
      }}>
        <h2 style={{ color: 'var(--fg)', margin: 0 }}>
          {t('menu.admin.title')}
        </h2>
        {localAdmin && (
          <span style={{
            padding: '4px 12px',
            background: 'var(--primary)',
            color: 'var(--bg)',
            borderRadius: 'var(--radius)',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            {t('menu.admin.localBadge')}
          </span>
        )}
      </div>

      {/* Local Admin Toggle */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={toggleLocalAdmin}
          style={{
            padding: '8px 16px',
            background: localAdmin ? 'var(--primary)' : 'var(--glass)',
            color: localAdmin ? 'var(--bg)' : 'var(--fg)',
            border: '1px solid var(--stroke)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer'
          }}
        >
          Local Admin {localAdmin ? 'AN' : 'AUS'}
        </button>
      </div>

      {/* Pending Suggestions */}
      <h3 style={{ color: 'var(--fg)', marginBottom: '1rem' }}>
        {t('menu.admin.pending')} ({pending.length})
      </h3>

      {pending.length === 0 ? (
        <div style={{ 
          color: 'var(--fg)', 
          opacity: 0.7,
          textAlign: 'center',
          padding: '2rem'
        }}>
          Keine offenen Vorschläge
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pending.map(suggestion => (
            <div
              key={suggestion.id}
              style={{
                padding: '16px',
                background: 'var(--glass)',
                border: '1px solid var(--stroke)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <span style={{
                  padding: '4px 8px',
                  background: 'var(--primary)',
                  color: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {getCategoryLabel(suggestion.categoryId)}
                </span>
                <span style={{ 
                  color: 'var(--fg)', 
                  opacity: 0.5,
                  fontSize: '0.8rem'
                }}>
                  {new Date(suggestion.timestamp).toLocaleDateString()}
                </span>
              </div>

              <p style={{ 
                color: 'var(--fg)', 
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                {suggestion.text}
              </p>

              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder={t('menu.admin.note')}
                  value={notes[suggestion.id] || ''}
                  onChange={(e) => handleNote(suggestion.id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--glass)',
                    border: '1px solid var(--stroke)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--fg)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => approve(suggestion.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#4ade80',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {t('menu.admin.approve')}
                </button>
                <button
                  onClick={() => reject(suggestion.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#f87171',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {t('menu.admin.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}