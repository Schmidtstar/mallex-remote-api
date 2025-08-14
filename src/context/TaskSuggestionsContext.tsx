
import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './AuthContext'

export interface TaskSuggestion {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  submittedBy: string
  submittedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
}

interface TaskSuggestionsContextType {
  suggestions: TaskSuggestion[]
  loading: boolean
  error: string | null
  addSuggestion: (suggestion: Omit<TaskSuggestion, 'id' | 'submittedAt' | 'status'>) => Promise<void>
  updateSuggestion: (id: string, updates: Partial<TaskSuggestion>) => Promise<void>
  deleteSuggestion: (id: string) => Promise<void>
  refreshSuggestions: () => Promise<void>
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | null>(null)

const STORAGE_KEY = 'mallex_task_suggestions'

interface TaskSuggestionsProviderProps {
  children: React.ReactNode
}

export function TaskSuggestionsProvider({ children }: TaskSuggestionsProviderProps) {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSuggestions()
  }, [user])

  const loadSuggestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Versuche Firebase zu laden
      if (user?.uid && db) {
        try {
          const suggestionsRef = collection(db, 'task_suggestions')
          const q = query(suggestionsRef, orderBy('submittedAt', 'desc'))
          const snapshot = await getDocs(q)
          
          const loadedSuggestions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt?.toDate() || new Date()
          })) as TaskSuggestion[]
          
          setSuggestions(loadedSuggestions)
          
          // Backup zu localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedSuggestions))
          console.log(`✅ Loaded ${loadedSuggestions.length} task suggestions from Firebase`)
          
        } catch (firebaseError) {
          console.warn('Firebase loading failed, using localStorage:', firebaseError)
          loadFromLocalStorage()
        }
      } else {
        // Kein User oder Firebase nicht verfügbar - localStorage verwenden
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
      setError('Failed to load task suggestions')
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved).map((s: any) => ({
          ...s,
          submittedAt: new Date(s.submittedAt)
        }))
        setSuggestions(parsed)
        console.log(`📦 Loaded ${parsed.length} task suggestions from localStorage`)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      setSuggestions([])
    }
  }

  const addSuggestion = async (suggestion: Omit<TaskSuggestion, 'id' | 'submittedAt' | 'status'>) => {
    const newSuggestion: TaskSuggestion = {
      ...suggestion,
      id: crypto.randomUUID(),
      submittedAt: new Date(),
      status: 'pending'
    }

    try {
      // Versuche zu Firebase zu speichern
      if (user?.uid && db) {
        try {
          const docRef = await addDoc(collection(db, 'task_suggestions'), {
            ...newSuggestion,
            submittedAt: Timestamp.fromDate(newSuggestion.submittedAt)
          })
          newSuggestion.id = docRef.id
          console.log('✅ Task suggestion saved to Firebase')
        } catch (firebaseError) {
          console.warn('Firebase save failed, using localStorage:', firebaseError)
        }
      }

      // Immer auch zu localStorage speichern
      const updated = [newSuggestion, ...suggestions]
      setSuggestions(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
    } catch (error) {
      console.error('Error adding suggestion:', error)
      throw new Error('Failed to add task suggestion')
    }
  }

  const updateSuggestion = async (id: string, updates: Partial<TaskSuggestion>) => {
    try {
      // Versuche Firebase zu updaten
      if (user?.uid && db) {
        try {
          const docRef = doc(db, 'task_suggestions', id)
          const updateData = { ...updates }
          if (updates.submittedAt) {
            updateData.submittedAt = Timestamp.fromDate(updates.submittedAt)
          }
          await updateDoc(docRef, updateData)
          console.log('✅ Task suggestion updated in Firebase')
        } catch (firebaseError) {
          console.warn('Firebase update failed, using localStorage:', firebaseError)
        }
      }

      // Lokalen State aktualisieren
      const updated = suggestions.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
      setSuggestions(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
    } catch (error) {
      console.error('Error updating suggestion:', error)
      throw new Error('Failed to update task suggestion')
    }
  }

  const deleteSuggestion = async (id: string) => {
    try {
      // Versuche von Firebase zu löschen
      if (user?.uid && db) {
        try {
          await deleteDoc(doc(db, 'task_suggestions', id))
          console.log('✅ Task suggestion deleted from Firebase')
        } catch (firebaseError) {
          console.warn('Firebase delete failed, using localStorage:', firebaseError)
        }
      }

      // Aus lokalem State entfernen
      const updated = suggestions.filter(s => s.id !== id)
      setSuggestions(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
    } catch (error) {
      console.error('Error deleting suggestion:', error)
      throw new Error('Failed to delete task suggestion')
    }
  }

  const refreshSuggestions = async () => {
    await loadSuggestions()
  }

  const value: TaskSuggestionsContextType = {
    suggestions,
    loading,
    error,
    addSuggestion,
    updateSuggestion,
    deleteSuggestion,
    refreshSuggestions
  }

  return (
    <TaskSuggestionsContext.Provider value={value}>
      {children}
    </TaskSuggestionsContext.Provider>
  )
}

export function useTaskSuggestions() {
  const context = useContext(TaskSuggestionsContext)
  if (!context) {
    throw new Error('useTaskSuggestions must be used within TaskSuggestionsProvider')
  }
  return context
}
