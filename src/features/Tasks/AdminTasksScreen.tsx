import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useIsAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import { categories, type CategoryKey } from '../Arena/categories'
import { challenges } from '../Arena/challenges'
import { createTaskApproved, listApprovedTasks, type Task } from '../../lib/tasksApi'
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
  hidden?: boolean // Added for toggleHide functionality
}

export function AdminTasksScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const [items, setItems] = useState<TaskSuggestion[]>([])
  const [directTasks, setDirectTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<SuggestionStatus | 'create' | 'direct' | 'static'>('pending')
  const [hiddenStaticTasks, setHiddenStaticTasks] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editingDirectId, setEditingDirectId] = useState<string | null>(null)
  const [editDirectText, setEditDirectText] = useState('')
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})

  // Task creation state  
  const [newTaskCategory, setNewTaskCategory] = useState<string>('schicksal')
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
                note: data.note,
                hidden: data.hidden || false // Initialize hidden property
              })
            })

            // Only use Firebase data if it has suggestions
            if (firebaseSuggestions.length > 0) {
              setItems(firebaseSuggestions)
              console.log('✅ Firebase suggestions loaded:', firebaseSuggestions.length)
              return
            } else {
              console.log('🔄 Firebase empty, falling back to localStorage with demo data')
            }
          } catch (firebaseError: any) {
            console.warn('Firebase load failed, using localStorage fallback:', firebaseError?.code)
          }
        }

        // Fallback to localStorage with demo data
        const saved = localStorage.getItem('mallex_admin_suggestions')
        let suggestions = saved ? JSON.parse(saved) : []

        // No demo data generation - start with empty state

        setItems(suggestions)
        console.log('📦 localStorage suggestions loaded:', suggestions.length)

        // Load direct tasks from Firebase
        try {
          const tasks = await listApprovedTasks()
          setDirectTasks(tasks)
          console.log('✅ Direct tasks loaded:', tasks.length)
        } catch (error) {
          console.error('❌ Failed to load direct tasks:', error)
          setDirectTasks([])
        }

        // 🚀 MIGRATE TO FIREBASE: Upload approved tasks to Firebase
        if (suggestions.length > 0 && isAdmin) {
          const approvedTasks = suggestions.filter(s => s.status === 'approved')
          console.log('🔄 Migrating', approvedTasks.length, 'approved tasks to Firebase...')

          // Sequential migration to avoid overwhelming Firebase
          let successful = 0
          for (const task of approvedTasks) {
            try {
              // Map German category IDs to English ones for Arena compatibility
              const categoryMapping: Record<string, string> = {
                'schicksal': 'fate',
                'schande': 'shame', 
                'verfuehrung': 'seduce',
                'eskalation': 'escalate',
                'beichte': 'confess'
              }

              const docRef = await addDoc(collection(db, 'tasks'), {
                text: task.text,
                category: categoryMapping[task.categoryId] || task.categoryId, // Map to English category
                status: 'approved',
                createdBy: task.authorId || 'system',
                createdAt: serverTimestamp(),
                hidden: task.hidden || false,
                migratedFromLocalStorage: true
              })
              console.log('✅ Migrated task:', task.text.substring(0, 50) + '...', docRef.id)
              successful++
            } catch (error: any) {
              console.error('⚠️ Migration failed for task:', task.id, error?.code || error?.message)
            }
          }

          console.log(`🎉 Migration completed! ${successful}/${approvedTasks.length} tasks migrated to Firebase.`)

          if (successful > 0) {
            console.log('🔄 Reloading Arena to show new tasks...')
          }
        }


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

    // Load hidden static tasks from localStorage
    const hiddenTasks = localStorage.getItem('mallex_hidden_static_tasks')
    if (hiddenTasks) {
      setHiddenStaticTasks(new Set(JSON.parse(hiddenTasks)))
    }
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

  const reject = async (id: string) => {
    const note = rejectNote[id] || ''
    try {
      // Firebase rejection first
      await updateDoc(doc(db, 'taskSuggestions', id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user?.uid,
        note
      })
      console.log('🔥 Firebase rejection successful for:', id)

      const updated = items.map(item =>
        item.id === id ? { ...item, status: 'rejected' as SuggestionStatus, note } : item
      )
      setItems(updated)
      localStorage.setItem('mallex_admin_suggestions', JSON.stringify(updated))
      setRejectNote(prev => ({ ...prev, [id]: '' }))

    } catch (error: any) {
      console.error('🚫 Firebase rejection failed:', error?.code)

      // localStorage fallback
      const updated = items.map(item =>
        item.id === id ? { ...item, status: 'rejected' as SuggestionStatus, note } : item
      )
      setItems(updated)
      localStorage.setItem('mallex_admin_suggestions', JSON.stringify(updated))
      setRejectNote(prev => ({ ...prev, [id]: '' }))
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
    reject(id).catch(error => console.error("Error in handleReject:", error))
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
      // Map German category IDs to English ones for API compatibility
      const categoryMapping: Record<string, string> = {
        'schicksal': 'fate',
        'schande': 'shame', 
        'verfuehrung': 'seduce',
        'eskalation': 'escalate',
        'beichte': 'confess'
      }

      const englishCategory = categoryMapping[newTaskCategory] || newTaskCategory

      await createTaskApproved(
        { category: englishCategory as CategoryKey, text: newTaskText.trim() },
        user?.email ?? user?.uid
      )

      setNewTaskText('')
      setCreateSuccess(t('tasks.create.success'))
      
      // Reload direct tasks to show the new task
      const tasks = await listApprovedTasks()
      setDirectTasks(tasks)

      setTimeout(() => setCreateSuccess(''), 3000)
    } catch (error) {
      console.error('Error creating task:', error)
      setCreateError('Fehler beim Erstellen der Aufgabe: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'))
    } finally {
      setCreating(false)
    }
  }

  // Define loadApprovedTasks to be used by delete handlers
  const loadApprovedTasks = async () => {
    // This function's implementation would typically mirror the logic in useEffect
    // for loading approved tasks, but for brevity and focus on the delete functionality,
    // we'll assume it reloads the necessary data. A more robust solution might pass
    // the setItems function or use a shared loading hook.
    // For this example, we'll simulate a reload by re-running the core logic.
    // In a real app, you'd likely refactor this into a reusable function.

    // Re-fetching suggestions to update the UI after deletion
    const querySnapshot = await getDocs(collection(db, 'taskSuggestions'));
    const fetchedItems: TaskSuggestion[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      fetchedItems.push({
        id: doc.id,
        text: data.text || '',
        categoryId: data.categoryId || 'fate',
        authorId: data.authorId || data.createdBy || '',
        createdAt: data.createdAt || new Date(),
        status: data.status || 'pending',
        author: data.author,
        note: data.note,
        hidden: data.hidden || false
      });
    });
    setItems(fetchedItems);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Task wirklich löschen?')) return;

    try {
      await deleteDoc(doc(db, 'tasks', taskId)); // Delete from tasks collection
      
      // Reload direct tasks
      const tasks = await listApprovedTasks()
      setDirectTasks(tasks)
      console.log('✅ Direct task deleted and reloaded')
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteAllTasks = async () => {
    if (!confirm('ALLE Tasks löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) return;
    if (!confirm('Sind Sie sicher? Alle Demo- und echten Tasks werden gelöscht!')) return;

    try {
      const tasksSnapshot = await getDocs(collection(db, 'tasks')); // Target 'tasks' collection for all tasks
      const deletePromises = tasksSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Reload direct tasks
      const tasks = await listApprovedTasks()
      setDirectTasks(tasks)
      alert(`${tasksSnapshot.size} Tasks erfolgreich gelöscht!`);
    } catch (error) {
      console.error('Error deleting all tasks:', error);
      alert('Fehler beim Löschen der Tasks!');
    }
  };

  const handleEditDirectTask = (task: Task) => {
    setEditingDirectId(task.id!)
    setEditDirectText(task.text)
  }

  const handleSaveDirectEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        text: editDirectText,
        editedAt: serverTimestamp(),
        editedBy: user?.uid
      })
      
      // Reload direct tasks
      const tasks = await listApprovedTasks()
      setDirectTasks(tasks)
      
      setEditingDirectId(null)
      setEditDirectText('')
      console.log('✅ Direct task updated successfully')
    } catch (error) {
      console.error('Error updating direct task:', error)
    }
  }

  const handleCancelDirectEdit = () => {
    setEditingDirectId(null)
    setEditDirectText('')
  }

  const toggleHideStaticTask = (taskKey: string) => {
    const newHiddenTasks = new Set(hiddenStaticTasks)
    if (newHiddenTasks.has(taskKey)) {
      newHiddenTasks.delete(taskKey)
    } else {
      newHiddenTasks.add(taskKey)
    }
    setHiddenStaticTasks(newHiddenTasks)
    localStorage.setItem('mallex_hidden_static_tasks', JSON.stringify([...newHiddenTasks]))
  }

  const getStaticTasks = () => {
    const staticTasks: Array<{key: string, text: string, category: string}> = []
    const categoryMapping = {
      'fate': 'Schicksal',
      'shame': 'Schande', 
      'seduce': 'Verführung',
      'escalate': 'Eskalation',
      'confess': 'Beichte'
    }
    
    Object.entries(challenges).forEach(([categoryId, tasks]) => {
      tasks.forEach((taskKey, index) => {
        staticTasks.push({
          key: taskKey,
          text: t(taskKey),
          category: categoryMapping[categoryId as keyof typeof categoryMapping] || categoryId
        })
      })
    })
    
    return staticTasks
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
            className={`${styles.tab} ${activeTab === 'direct' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('direct')}
          >
            Direkte Tasks ({directTasks.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'static' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('static')}
          >
            Statische Tasks ({getStaticTasks().length - hiddenStaticTasks.size}/{getStaticTasks().length})
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

        {activeTab === 'direct' && (
          <div className={styles.directTasksList}>
            {directTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>Keine direkten Tasks vorhanden</h3>
                <p>Direkt erstellte Tasks werden hier angezeigt.</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {directTasks.map((task) => (
                  <div key={task.id} className={styles.item}>
                    <div className={styles.itemHeader}>
                      <span className={styles.category}>
                        {getCategoryLabel(task.category)}
                      </span>
                      <span className={styles.date}>
                        {task.createdAt ? new Date(task.createdAt.toDate()).toLocaleDateString() : 'Unbekannt'}
                      </span>
                    </div>
                    <div className={styles.itemContent}>
                      {editingDirectId === task.id ? (
                        <div className={styles.editForm}>
                          <textarea
                            value={editDirectText}
                            onChange={(e) => setEditDirectText(e.target.value)}
                            className={styles.editTextarea}
                            rows={3}
                          />
                          <div className={styles.editActions}>
                            <button
                              onClick={() => handleSaveDirectEdit(task.id!)}
                              className={styles.saveButton}
                            >
                              💾 Speichern
                            </button>
                            <button
                              onClick={handleCancelDirectEdit}
                              className={styles.cancelButton}
                            >
                              ❌ Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.text}>{task.text}</p>
                      )}
                    </div>
                    <div className={styles.author}>
                      Erstellt von: {task.createdBy || 'System'}
                    </div>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEditDirectTask(task)}
                        className={styles.editButton}
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id!)}
                        className={styles.deleteButton}
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'static' && (
          <div className={styles.directTasksList}>
            <div className={styles.itemsList}>
              {getStaticTasks().map((task) => (
                <div key={task.key} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={styles.category}>
                      {task.category}
                    </span>
                    <span className={styles.date}>
                      Statisch
                    </span>
                  </div>
                  <div className={styles.itemContent}>
                    <p className={styles.text} style={{ 
                      opacity: hiddenStaticTasks.has(task.key) ? 0.5 : 1,
                      textDecoration: hiddenStaticTasks.has(task.key) ? 'line-through' : 'none'
                    }}>
                      {task.text}
                    </p>
                  </div>
                  <div className={styles.author}>
                    Übersetzungsschlüssel: {task.key}
                  </div>
                  <div className={styles.actions}>
                    <button
                      onClick={() => toggleHideStaticTask(task.key)}
                      className={hiddenStaticTasks.has(task.key) ? styles.showButton : styles.hideButton}
                    >
                      {hiddenStaticTasks.has(task.key) ? '👁️ Einblenden' : '🙈 Ausblenden'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className={styles.createTaskForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('tasks.create.categoryLabel')}</label>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className={styles.select}
              >
                <option value="schicksal">Schicksal</option>
                <option value="schande">Schande</option>
                <option value="verfuehrung">Verführung</option>
                <option value="eskalation">Eskalation</option>
                <option value="beichte">Beichte</option>
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