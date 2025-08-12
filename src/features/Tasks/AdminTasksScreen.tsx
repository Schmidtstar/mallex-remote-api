
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
        
        // Add comprehensive demo suggestions if none exist
        if (suggestions.length === 0) {
          suggestions = [
            // === SCHICKSAL (5 Aufgaben) ===
            {
              id: 'schicksal-1',
              text: 'Erzähle von deinem ersten Kuss und wie du dich dabei gefühlt hast.',
              categoryId: 'schicksal',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 120),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schicksal-2',
              text: 'Beschreibe deinen größten Traum und was du dafür opfern würdest.',
              categoryId: 'schicksal',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 115),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schicksal-3',
              text: 'Erzähle von einem Moment, der dein Leben für immer verändert hat.',
              categoryId: 'schicksal',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 110),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schicksal-4',
              text: 'Offenbare deine tiefste Angst vor der Zukunft.',
              categoryId: 'schicksal',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 105),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schicksal-5',
              text: 'Erzähle von einer Person, die du verloren hast und immer noch vermisst.',
              categoryId: 'schicksal',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 100),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },

            // === SCHANDE (5 Aufgaben) ===
            {
              id: 'schande-1',
              text: 'Gestehe das Peinlichste, was dir je in der Öffentlichkeit passiert ist.',
              categoryId: 'schande',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 95),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schande-2',
              text: 'Erzähle von deiner schlimmsten schlechten Angewohnheit.',
              categoryId: 'schande',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 90),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schande-3',
              text: 'Beschreibe das Dümmste, was du jemals aus Liebe getan hast.',
              categoryId: 'schande',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 85),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schande-4',
              text: 'Erzähle von einem Moment, in dem du jemanden zutiefst enttäuscht hast.',
              categoryId: 'schande',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 80),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'schande-5',
              text: 'Gestehe eine Lüge, die du bis heute nicht korrigiert hast.',
              categoryId: 'schande',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 75),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },

            // === VERFÜHRUNG (5 Aufgaben) ===
            {
              id: 'verfuehrung-1',
              text: 'Flüstere der Person links von dir etwas Verführerisches ins Ohr.',
              categoryId: 'verfuehrung',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 70),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'verfuehrung-2',
              text: 'Erzähle von deiner wildesten romantischen Fantasie.',
              categoryId: 'verfuehrung',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 65),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'verfuehrung-3',
              text: 'Gib jemandem in der Runde ein sinnliches Kompliment.',
              categoryId: 'verfuehrung',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 60),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'verfuehrung-4',
              text: 'Beschreibe, wie du jemanden verführen würdest, ohne Worte zu benutzen.',
              categoryId: 'verfuehrung',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 55),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'verfuehrung-5',
              text: 'Küsse jemanden sanft auf die Hand und schaue dabei tief in die Augen.',
              categoryId: 'verfuehrung',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 50),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },

            // === ESKALATION (5 Aufgaben) ===
            {
              id: 'eskalation-1',
              text: 'Wage etwas völlig Verrücktes, was du noch nie zuvor getan hast.',
              categoryId: 'eskalation',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 45),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'eskalation-2',
              text: 'Fordere jemanden zu einem absurden Duell heraus (z.B. Starren, Armdrücken).',
              categoryId: 'eskalation',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 40),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'eskalation-3',
              text: 'Tausche für den Rest des Spiels alle Getränke mit der Person gegenüber.',
              categoryId: 'eskalation',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 35),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'eskalation-4',
              text: 'Mache 3 Runden um den Tisch und erzähle dabei eine Geschichte rückwärts.',
              categoryId: 'eskalation',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 30),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'eskalation-5',
              text: 'Bestimme eine neue Spielregel, die alle für die nächsten 10 Minuten befolgen müssen.',
              categoryId: 'eskalation',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 25),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },

            // === BEICHTE (5 Aufgaben) ===
            {
              id: 'beichte-1',
              text: 'Gestehe dein dunkelstes Geheimnis, das niemand über dich weiß.',
              categoryId: 'beichte',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 20),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'beichte-2',
              text: 'Offenbare, was du an dir selbst am meisten hasst.',
              categoryId: 'beichte',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 15),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'beichte-3',
              text: 'Erzähle von einem Moment, in dem du jemanden zutiefst verraten hast.',
              categoryId: 'beichte',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 10),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'beichte-4',
              text: 'Gestehe eine Sünde, für die du dich immer noch schämst.',
              categoryId: 'beichte',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 5),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },
            {
              id: 'beichte-5',
              text: 'Offenbare, wen du in dieser Runde heimlich bewunderst und warum.',
              categoryId: 'beichte',
              authorId: 'system',
              createdAt: new Date(Date.now() - 1000 * 60 * 2),
              status: 'approved',
              author: { email: 'system@mallex.de', uid: 'system' }
            },

            // === PENDING SUGGESTIONS (User-generated) ===
            {
              id: 'demo-pending-1',
              text: 'Trinke einen Schluck und erzähle eine Geschichte aus deiner Schulzeit.',
              categoryId: 'schande',
              authorId: 'demo-user-1',
              createdAt: new Date(Date.now() - 1000 * 60 * 30),
              status: 'pending',
              author: { email: 'user1@example.com', uid: 'demo-user-1' }
            },
            {
              id: 'demo-pending-2', 
              text: 'Massiere jemandem 30 Sekunden lang die Schultern.',
              categoryId: 'verfuehrung',
              authorId: 'demo-user-2',
              createdAt: new Date(Date.now() - 1000 * 60 * 15),
              status: 'pending',
              author: { email: 'user2@example.com', uid: 'demo-user-2' }
            },

            // === REJECTED SUGGESTIONS ===
            {
              id: 'demo-rejected-1',
              text: 'Springe nackt in den Pool.',
              categoryId: 'eskalation',
              authorId: 'demo-user-7',
              createdAt: new Date(Date.now() - 1000 * 60 * 90),
              status: 'rejected',
              note: 'Zu extrem für die meisten Spielrunden',
              author: { email: 'user7@example.com', uid: 'demo-user-7' }
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

  const toggleHide = async (id: string) => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) return

      const hidden = !item.hidden

      // Try Firebase first if admin
      if (isAdmin) {
        try {
          await updateDoc(doc(db, 'taskSuggestions', id), {
            hidden,
            hiddenAt: hidden ? serverTimestamp() : null,
            hiddenBy: hidden ? user?.uid : null
          })
          console.log('✅ Firebase hide/show successful')
        } catch (firebaseError: any) {
          console.warn('Firebase hide/show failed, using localStorage:', firebaseError?.code)
        }
      }
      
      // Always update local state
      const updated = items.map(item => 
        item.id === id ? { ...item, hidden } : item
      )
      setItems(updated)
      localStorage.setItem('mallex_admin_suggestions', JSON.stringify(updated))
    } catch (error) {
      console.error('Hide/show failed:', error)
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
            {loading ? (
              <div className={styles.loading}>
                Lade Vorschläge...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>Keine {activeTab} Aufgaben vorhanden</h3>
                <p>
                  {activeTab === 'pending' && 'Sobald Benutzer Aufgaben vorschlagen, erscheinen sie hier zur Moderation.'}
                  {activeTab === 'approved' && 'Genehmigte Aufgaben werden hier angezeigt.'}
                  {activeTab === 'rejected' && 'Abgelehnte Aufgaben werden hier angezeigt.'}
                </p>
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
                            ✅ {t('adminTasks.actions.approve')}
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
                              ❌ {t('adminTasks.actions.reject')}
                            </button>
                          </div>
                        </>
                      )}

                      {item.status === 'approved' && (
                        <button
                          onClick={() => toggleHide(item.id)}
                          className={item.hidden ? styles.showButton : styles.hideButton}
                        >
                          {item.hidden ? '👁️ Einblenden' : '🙈 Ausblenden'}
                        </button>
                      )}

                      <button
                        onClick={() => handleEdit(item)}
                        className={styles.editButton}
                      >
                        ✏️ {t('adminTasks.actions.edit')}
                      </button>

                      <button
                        onClick={() => remove(item.id)}
                        className={styles.deleteButton}
                      >
                        🗑️ {t('adminTasks.actions.delete')}
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
