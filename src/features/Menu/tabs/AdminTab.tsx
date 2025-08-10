
import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { categories as categoriesMap } from '../../Arena/categories'
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext'
import { useAuth } from '../../../context/AuthContext'

export default function AdminTab() {
  const { t } = useTranslation()
  const { mode } = useAuth()
  const { 
    suggestions, 
    customChallenges, 
    approveSuggestion, 
    rejectSuggestion, 
    addCustomChallenge,
    removeCustomChallenge 
  } = useTaskSuggestions()
  
  const [activeSection, setActiveSection] = useState<'pending' | 'custom'>('pending')
  const [selectedCategory, setSelectedCategory] = useState<string>('fate')
  const [newTaskText, setNewTaskText] = useState<string>('')
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({})

  // Turn categories object into an array
  const categoryList = useMemo(
    () =>
      Object.entries(categoriesMap).map(([id, labelKey]) => ({
        id,
        labelKey: String(labelKey),
      })),
    []
  )

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')

  const handleApprove = async (id: string) => {
    await approveSuggestion(id, reviewNote[id] || undefined)
    setReviewNote(prev => ({ ...prev, [id]: '' }))
  }

  const handleReject = async (id: string) => {
    await rejectSuggestion(id, reviewNote[id] || undefined)
    setReviewNote(prev => ({ ...prev, [id]: '' }))
  }

  const handleAddCustom = async () => {
    if (newTaskText.trim().length >= 10) {
      await addCustomChallenge(selectedCategory, newTaskText.trim())
      setNewTaskText('')
    }
  }

  const isLocalMode = mode !== 'firebase'

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2>{t('menu.admin.title')}</h2>
        {isLocalMode && (
          <span style={{
            padding: '4px 8px',
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            color: '#ffc107',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600
          }}>
            {t('menu.admin.localBadge')}
          </span>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveSection('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: activeSection === 'pending' ? 'var(--primary)' : 'transparent',
            color: activeSection === 'pending' ? 'var(--bg)' : 'var(--fg)',
            border: '1px solid var(--stroke)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeSection === 'pending' ? 600 : 400
          }}
        >
          {t('menu.admin.pending')} ({pendingSuggestions.length})
        </button>
        <button
          onClick={() => setActiveSection('custom')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: activeSection === 'custom' ? 'var(--primary)' : 'transparent',
            color: activeSection === 'custom' ? 'var(--bg)' : 'var(--fg)',
            border: '1px solid var(--stroke)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeSection === 'custom' ? 600 : 400
          }}
        >
          {t('menu.admin.custom')}
        </button>
      </div>

      {/* Pending suggestions section */}
      {activeSection === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingSuggestions.length === 0 ? (
            <div style={{ 
              padding: '24px', 
              textAlign: 'center', 
              color: 'rgba(255,255,255,0.6)',
              fontStyle: 'italic' 
            }}>
              Keine offenen Vorschläge
            </div>
          ) : (
            pendingSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--glass)',
                  border: '1px solid var(--stroke)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px' 
                  }}>
                    <strong style={{ color: 'var(--primary)' }}>
                      {t(categoryList.find(c => c.id === suggestion.categoryId)?.labelKey || '')}
                    </strong>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>
                      {suggestion.authorName} • {new Date(suggestion.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    "{suggestion.text}"
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={t('menu.admin.note')}
                    value={reviewNote[suggestion.id] || ''}
                    onChange={(e) => setReviewNote(prev => ({
                      ...prev,
                      [suggestion.id]: e.target.value
                    }))}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'var(--fg)',
                      border: '1px solid var(--stroke)',
                      fontSize: '12px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApprove(suggestion.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        color: '#4CAF50',
                        border: '1px solid rgba(76, 175, 80, 0.5)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      ✓ {t('menu.admin.approve')}
                    </button>
                    <button
                      onClick={() => handleReject(suggestion.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                        color: '#f44336',
                        border: '1px solid rgba(244, 67, 54, 0.5)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      ✗ {t('menu.admin.reject')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom challenges section */}
      {activeSection === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Add new custom challenge */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--glass)',
            border: '1px solid var(--stroke)',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 12px' }}>{t('menu.admin.add')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Neue Aufgabe eingeben..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'var(--fg)',
                    border: '1px solid var(--stroke)',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleAddCustom}
                  disabled={newTaskText.trim().length < 10}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: newTaskText.trim().length >= 10 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    color: newTaskText.trim().length >= 10 ? 'var(--bg)' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                    cursor: newTaskText.trim().length >= 10 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  + {t('menu.admin.add')}
                </button>
              </div>
            </div>
          </div>

          {/* Show custom challenges by category */}
          {categoryList.map((category) => {
            const categoryCustoms = customChallenges[category.id] || []
            if (categoryCustoms.length === 0) return null

            return (
              <div
                key={category.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--glass)',
                  border: '1px solid var(--stroke)',
                  borderRadius: '8px'
                }}
              >
                <h4 style={{ margin: '0 0 12px' }}>
                  {t(category.labelKey)} ({categoryCustoms.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categoryCustoms.map((task, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '6px'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{task}</span>
                      <button
                        onClick={() => removeCustomChallenge(category.id, index)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(244, 67, 54, 0.2)',
                          color: '#f44336',
                          border: '1px solid rgba(244, 67, 54, 0.5)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {t('menu.admin.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
