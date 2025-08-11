
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useTaskSuggestions, TaskSuggestion, SuggestionStatus } from '../../context/TaskSuggestionsContext'
import { useIsAdmin } from '../../context/AdminContext'
import { categories } from '../Arena/categories'
import styles from './AdminTasksScreen.module.css'

export function AdminTasksScreen() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const { items, approve, reject, edit, remove } = useTaskSuggestions()
  const [activeTab, setActiveTab] = useState<SuggestionStatus>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})

  if (!isAdmin) {
    return <Navigate to="/arena" replace />
  }

  const filteredItems = items.filter(item => item.status === activeTab)

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? t(category.labelKey) : categoryId
  }

  const handleEdit = (item: TaskSuggestion) => {
    setEditingId(item.id)
    setEditText(item.text)
  }

  const handleSaveEdit = (id: string) => {
    edit(id, { text: editText })
    setEditingId(null)
    setEditText('')
  }

  const handleReject = (id: string) => {
    const note = rejectNote[id] || ''
    reject(id, note)
    setRejectNote(prev => ({ ...prev, [id]: '' }))
  }

  const tabs: { key: SuggestionStatus; labelKey: string }[] = [
    { key: 'pending', labelKey: 'adminTasks.pending' },
    { key: 'approved', labelKey: 'adminTasks.approved' },
    { key: 'rejected', labelKey: 'adminTasks.rejected' }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('adminTasks.title')}</h1>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
          >
            {t(tab.labelKey)} ({items.filter(item => item.status === tab.key).length})
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            Keine {t(tabs.find(t => t.key === activeTab)?.labelKey || '')} vorhanden
          </div>
        ) : (
          <div className={styles.itemsList}>
            {filteredItems.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={styles.category}>
                    {getCategoryLabel(item.categoryId)}
                  </span>
                  <span className={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className={styles.itemContent}>
                  {editingId === item.id ? (
                    <div className={styles.editForm}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={styles.editTextarea}
                        rows={3}
                      />
                      <div className={styles.editActions}>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className={styles.saveButton}
                        >
                          {t('adminTasks.actions.save')}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={styles.cancelButton}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.text}>{item.text}</p>
                  )}
                </div>

                {item.note && (
                  <div className={styles.note}>
                    <strong>Notiz:</strong> {item.note}
                  </div>
                )}

                {item.author && (
                  <div className={styles.author}>
                    Autor: {item.author.email || item.author.uid || 'Unbekannt'}
                  </div>
                )}

                <div className={styles.actions}>
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approve(item.id)}
                        className={styles.approveButton}
                      >
                        {t('adminTasks.actions.approve')}
                      </button>
                      <div className={styles.rejectSection}>
                        <input
                          type="text"
                          placeholder={t('adminTasks.note')}
                          value={rejectNote[item.id] || ''}
                          onChange={(e) => setRejectNote(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className={styles.noteInput}
                        />
                        <button
                          onClick={() => handleReject(item.id)}
                          className={styles.rejectButton}
                        >
                          {t('adminTasks.actions.reject')}
                        </button>
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.editButton}
                  >
                    {t('adminTasks.actions.edit')}
                  </button>
                  
                  <button
                    onClick={() => remove(item.id)}
                    className={styles.deleteButton}
                  >
                    {t('adminTasks.actions.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
