
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useIsAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import { categories } from '../Arena/categories'
import { createTaskApproved } from '../../lib/tasksApi'
import styles from './AdminTasksScreen.module.css'

export type SuggestionStatus = 'pending' | 'approved' | 'rejected'

interface TaskSuggestion {
  id: string
  text: string
  categoryId: string
  authorId: string
  createdAt: any
  status: SuggestionStatus
  author?: { email?: string; uid?: string }
  note?: string
}

export function AdminTasksScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const [items, setItems] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(false)
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

  // Admin-specific data loading with Firebase fallback
  useEffect(() => {
    if (!isAdmin || !user?.uid) return
    
    const loadSuggestions = async () => {
      setLoading(true)
      try {
        // Try Firebase first if admin is confirmed
        if (isAdmin) {
          try {
            const querySnapshot = await getDocs(collection(db, 'taskSuggestions'))
            const firebaseSuggestions: TaskSuggestion[] = []
            
            querySnapshot.forEach((doc) => {
              const data = doc.data()
              firebaseSuggestions.push({
                id: doc.id,
                text: data.text || '',
                categoryId: data.categoryId || 'fate',
                authorId: data.authorId || data.createdBy || '',
                createdAt: data.createdAt || new Date(),
                status: data.status || 'pending',
                author: data.author,
                note: data.note
              })
            })
            
            setItems(firebaseSuggestions)
            console.log('✅ Firebase suggestions loaded:', firebaseSuggestions.length)
            return
          } catch (firebaseError: any) {
            console.warn('Firebase load failed, using localStorage fallback:', firebaseError?.code)
          }
        }
        
        // Fallback to localStorage with demo data
        const saved = localStorage.getItem('mallex_admin_suggestions')
        let suggestions = saved ? JSON.parse(saved) : []
        
        // Add demo suggestions if none exist
        if (suggestions.length === 0) {
          suggestions = [
            {
              id: 'demo-1',
              text: 'Trinke einen Schluck und erzähle eine peinliche Geschichte aus deiner Kindheit.',
              categoryId: 'schande',
              authorId: 'demo-user',
              createdAt: new Date(),
              status: 'pending',
              author: { email: 'demo@example.com' }
            },
            {
              id: 'demo-2', 
              text: 'Küsse die Person zu deiner Rechten auf die Stirn.',
              categoryId: 'verfuehrung',
              authorId: 'demo-user',
              createdAt: new Date(),
              status: 'pending',
              author: { email: 'demo2@example.com' }
            },
            {
              id: 'demo-3',
              text: 'Gestehe deine größte Schwäche vor der Gruppe.',
              categoryId: 'beichte',
              authorId: 'demo-user',
              createdAt: new Date(),
              status: 'approved',
              author: { email: 'demo3@example.com' }
            }
          ]
          localStorage.setItem('mallex_admin_suggestions', JSON.stringify(suggestions))
          console.log('🎭 Demo suggestions created')
        }
        
        setItems(suggestions)
        console.log('📦 localStorage suggestions loaded:', suggestions.length)
        
      } catch (error) {
        console.error('Admin suggestions load failed:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    loadSuggestions().catch(error => {
      console.error('loadSuggestions promise error:', error)
      setItems([])
      setLoading(false)
    })
  }, [isAdmin, user?.uid])

  if (!isAdmin) {
    return <Navigate to="/arena" replace />
  }

  // Admin actions with comprehensive error handling
  const approve = async (id: string) => {
    try {
      // Try Firebase first if admin
      if (isAdmin) {
        try {
          await updateDoc(doc(db, 'taskSuggestions', id), {
            status: 'approved',
            approvedAt: serverTimestamp(),
            approvedBy: user?.uid
          })
          console.log('✅ Firebase approval successful')
        } catch (firebaseError: any) {
          console.warn('Firebase approval failed, using localStorage:', firebaseError?.code)
        }
      }
      
      // Always update local state
      const updated = items.map(item => 
        item.id === id ? { ...item, status: 'approved' as SuggestionStatus } : item
      )
      setItems(updated)
      localStorage.setItem('mallex_admin_suggestions', JSON.stringify(updated))
    } catch (error) {
      console.error('Approve failed:', error)
    }
  }

  const reject = async (id: string, note?: string) => {
    try {
      // Try Firebase first if admin
      if (isAdmin) {
        try {
          await updateDoc(doc(db, 'taskSuggestions', id), {
            status: 'rejected',
            rejectedAt: serverTimestamp(),
            rejectedBy: user?.uid,
            note: note || ''
          })
          console.log('✅ Firebase rejection successful')
        } catch (firebaseError: any) {
          console.warn('Firebase rejection failed, using localStorage:', firebaseError?.code)
        }
      }
      
      // Always update local state
      const updated = items.map(item => 
        item.id === id ? { ...item, status: 'rejected' as SuggestionStatus, note } : item
      )
      setItems(updated)
      localStorage.setItem('mallex_admin_suggestions', JSON.stringify(updated))
      setRejectNote(prev => ({ ...prev, [id]: '' }))
    } catch (error) {
      console.error('Reject failed:', error)
    }
  }

  const edit = async (id: string, updates: { text: string }) => {
    try {
      // Try Firebase first if admin
      if (isAdmin) {
        try {
          await updateDoc(doc(db, 'taskSuggestions', id), {
            text: updates.text,
            editedAt: serverTimestamp(),
            editedBy: user?.uid
          })
          console.log('✅ Firebase edit successful')
        } catch (firebaseError: any) {
          console.warn('Firebase edit failed, using localStorage:', firebaseError?.code)
        }
      }
      
      // Always update local state
      const updated = items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
      setItems(updated)
      localStorage.setItem('mallex_admin_suggestions', JSON.stringify(updated))
    } catch (error) {
      console.error('Edit failed:', error)
    }
  }

  const remove = async (id: string) => {
    try {
      // Try Firebase first if admin
      if (isAdmin) {
        try {
          await deleteDoc(doc(db, 'taskSuggestions', id))
          console.log('✅ Firebase deletion successful')
        } catch (firebaseError: any) {
          console.warn('Firebase deletion failed, using localStorage:', firebaseError?.code)
        }
      }
      
      // Always update local state
      const updated = items.filter(item => item.id !== id)
      setItems(updated)
      localStorage.setItem('mallex_admin_suggestions', JSON.stringify(updated))
    } catch (error) {
      console.error('Delete failed:', error)
    }
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

      setTimeout(() => setCreateSuccess(''), 3000)
    } catch (error) {
      console.error('Error creating task:', error)
      setCreateError('Fehler beim Erstellen der Aufgabe')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('adminTasks.title')}</h1>
        <div className={styles.adminInfo}>
          👤 User: {user?.email || user?.uid} | 
          🔧 Admin: {isAdmin ? '✅' : '❌'} |
          📦 Suggestions: {items.length}
        </div>

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
                Keine {activeTab} Aufgaben vorhanden
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
