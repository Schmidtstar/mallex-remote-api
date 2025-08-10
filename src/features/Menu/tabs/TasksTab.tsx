
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categories } from '../../Arena/categories'
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext'

export default function TasksTab() {
  const { t } = useTranslation()
  const { getMergedTasks } = useTaskSuggestions()
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)

  const tasks = getMergedTasks(selectedCategory)

  return (
    <div>
      <h2 style={{ color: 'var(--fg)', marginBottom: '1.5rem' }}>
        {t('menu.tasks.title')}
      </h2>

      {/* Category Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {categories.map(category => {
          const categoryTasks = getMergedTasks(category.id)
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '8px 16px',
                background: selectedCategory === category.id ? 'var(--primary)' : 'var(--glass)',
                color: selectedCategory === category.id ? 'var(--bg)' : 'var(--fg)',
                border: '1px solid var(--stroke)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                position: 'relative'
              }}
            >
              {t(category.labelKey, category.id)}
              <span style={{
                marginLeft: '8px',
                background: selectedCategory === category.id ? 'rgba(0,0,0,0.2)' : 'var(--primary)',
                color: selectedCategory === category.id ? 'var(--bg)' : 'var(--bg)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {categoryTasks.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tasks List */}
      <div style={{ marginBottom: '1rem', color: 'var(--fg)', opacity: 0.7 }}>
        {t('menu.tasks.count', { count: tasks.length })}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map((task, index) => (
          <div
            key={index}
            style={{
              padding: '16px',
              background: 'var(--glass)',
              border: '1px solid var(--stroke)',
              borderRadius: 'var(--radius)',
              color: 'var(--fg)'
            }}
          >
            {task.startsWith('arena.') ? t(task, task) : task}
          </div>
        ))}
      </div>
    </div>
  )
}
