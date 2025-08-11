import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useTaskSuggestions, TaskSuggestion, SuggestionStatus } from '../../context/TaskSuggestionsContext'
import { useIsAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import { categories } from '../Arena/categories'
import { createTaskApproved } from '../../lib/tasksApi'
import styles from './AdminTasksScreen.module.css'

export function AdminTasksScreen() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const { user } = useAuth()
  const { items, approve, reject, edit, remove } = useTaskSuggestions()
  const [activeTab, setActiveTab] = useState<SuggestionStatus | 'create'>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})

  // Task creation state
  const [newTaskCategory, setNewTaskCategory] = useState<'fate' | 'shame' | 'seduce' | 'escalate' | 'confess'>('fate')
  const [newTaskText, setNewTaskText] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

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

  const handleCreateTask = async () => {
    setCreateError('')
    setCreateSuccess('')

    if (newTaskText.trim().length < 5) {
      setCreateError(t('tasks.create.error'))
      return
    }

    setCreating(true)
    try {
      await createTaskApproved(
        { category: newTaskCategory, text: newTaskText.trim() },
        user?.email ?? user?.uid
      )

      setNewTaskText('')
      setCreateSuccess(t('tasks.create.success'))

      // Clear success message after 3 seconds
      setTimeout(() => setCreateSuccess(''), 3000)
    } catch (error) {
      console.error('Error creating task:', error)
      setCreateError('Fehler beim Erstellen der Aufgabe')
    } finally {
      setCreating(false)
    }
  }

  const tabs: { key: SuggestionStatus | 'create'; labelKey?: string }[] = [
    { key: 'pending', labelKey: 'adminTasks.pending' },
    { key: 'approved', labelKey: 'adminTasks.approved' },
    { key: 'rejected', labelKey: 'adminTasks.rejected' },
    { key: 'create' } // Tab for creating new tasks
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('adminTasks.title')}</h1>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            {t('adminTasks.pending')} ({items.filter(item => item.status === 'pending').length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'approved' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            {t('adminTasks.approved')} ({items.filter(item => item.status === 'approved').length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'rejected' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            {t('adminTasks.rejected')} ({items.filter(item => item.status === 'rejected').length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('create')}
          >
            {t('tasks.create.title')}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'rejected') && (
          <>
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
          </>
        )}

        {activeTab === 'create' && (
          <div className={styles.createTaskForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('tasks.create.categoryLabel')}</label>
              <select 
                value={newTaskCategory} 
                onChange={(e) => setNewTaskCategory(e.target.value as any)}
                className={styles.select}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('tasks.create.textLabel')}</label>
              <textarea 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder={t('tasks.create.placeholder')}
                className={styles.textarea}
                rows={4}
                disabled={creating}
              />
            </div>

            {createError && (
              <div className={styles.error}>{createError}</div>
            )}

            {createSuccess && (
              <div className={styles.success}>{createSuccess}</div>
            )}

            <button 
              onClick={handleCreateTask}
              disabled={creating || newTaskText.trim().length < 5}
              className={styles.createButton}
            >
              {creating ? t('tasks.create.creating') : t('tasks.create.submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}