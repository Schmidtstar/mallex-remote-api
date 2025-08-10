
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categories as categoriesMap } from '../../Arena/categories'
import { challenges } from '../../Arena/challenges'
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext'

export default function TasksTab() {
  const { t } = useTranslation()
  const { customChallenges } = useTaskSuggestions()

  // Turn categories object into an array: [{ id: 'fate', labelKey: 'categories.fate' }, ...]
  const categoryList = useMemo(
    () =>
      Object.entries(categoriesMap).map(([id, labelKey]) => ({
        id,
        labelKey: String(labelKey),
      })),
    []
  )

  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>(
    categoryList[0]?.id ?? 'fate'
  )

  // Merge builtin challenges with custom ones
  const mergedTasks: string[] = useMemo(() => {
    const builtin = challenges[selectedCategoryKey] ?? []
    const custom = customChallenges[selectedCategoryKey] ?? []
    return [...builtin, ...custom]
  }, [selectedCategoryKey, customChallenges])

  return (
    <div style={{ padding: '16px', display: 'grid', gap: 16 }}>
      <h2>{t('menu.tasks.title')}</h2>

      {/* Category selector */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {categoryList.map((category) => {
          const isActive = selectedCategoryKey === category.id
          const builtinCount = (challenges[category.id] ?? []).length
          const customCount = (customChallenges[category.id] ?? []).length
          const totalCount = builtinCount + customCount

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryKey(category.id)}
              style={{
                padding: '10px 14px',
                backgroundColor: isActive ? '#4CAF50' : 'rgba(255,255,255,0.18)',
                color: '#fff',
                border: isActive
                  ? '2px solid #4CAF50'
                  : '2px solid rgba(255,255,255,0.28)',
                borderRadius: 24,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all .2s ease',
              }}
            >
              <span>{t(category.labelKey) || category.labelKey}</span>
              <span
                style={{
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(255,255,255,0.35)',
                  borderRadius: 12,
                  padding: '2px 6px',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {totalCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tasks list */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>
          {t(categoryList.find(c => c.id === selectedCategoryKey)?.labelKey || '')} 
          {' '} - {t('menu.tasks.count', { count: mergedTasks.length })}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mergedTasks.map((task, index) => {
            const isCustom = index >= (challenges[selectedCategoryKey]?.length ?? 0)
            return (
              <div
                key={index}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--glass)',
                  border: '1px solid var(--stroke)',
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                <span>{task}</span>
                {isCustom && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '8px',
                      fontSize: '10px',
                      padding: '2px 6px',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--bg)',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}
                  >
                    Custom
                  </span>
                )}
              </div>
            )
          })}
          {mergedTasks.length === 0 && (
            <div style={{ 
              padding: '24px', 
              textAlign: 'center', 
              color: 'rgba(255,255,255,0.6)',
              fontStyle: 'italic' 
            }}>
              Keine Aufgaben in dieser Kategorie
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
