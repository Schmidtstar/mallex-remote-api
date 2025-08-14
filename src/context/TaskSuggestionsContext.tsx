import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

export interface TaskSuggestion {
  id: string
  title: string
  description: string
  category: string
  suggestedBy: string
  suggestedByUid: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: any
  adminComments?: string
  isAnonymous?: boolean
}

interface TaskSuggestionsContextType {
  suggestions: TaskSuggestion[]
  loading: boolean
  error: string | null
  addSuggestion: (suggestion: Omit<TaskSuggestion, 'id' | 'status' | 'createdAt'>) => Promise<void>
  updateSuggestionStatus: (id: string, status: TaskSuggestion['status'], adminComments?: string) => Promise<void>
  deleteSuggestion: (id: string) => Promise<void>
  refreshSuggestions: () => void
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | undefined>(undefined)

const STORAGE_KEY = 'mallex_task_suggestions'

interface TaskSuggestionsProviderProps {
  children: ReactNode
}

export function TaskSuggestionsProvider({ children }: TaskSuggestionsProviderProps) {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true)
      setError(null)

      try {
        if (!user?.uid) {
          // Fallback to localStorage for offline use
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const parsed = JSON.parse(saved)
            setSuggestions(parsed)
          } else {
            setSuggestions([])
          }
          setLoading(false)
          return
        }

        // Load from Firebase for authenticated users
        const suggestionsRef = collection(db, 'taskSuggestions')
        const unsubscribe = onSnapshot(
          suggestionsRef,
          (snapshot) => {
            const loadedSuggestions = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as TaskSuggestion[]

            setSuggestions(loadedSuggestions)
            // Also save to localStorage as backup
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedSuggestions))
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error('Error loading suggestions:', err)
            setError('Fehler beim Laden der Vorschläge')
            // Fallback to localStorage on error
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
              setSuggestions(JSON.parse(saved))
            }
            setLoading(false)
          }
        )

        return unsubscribe
      } catch (error) {
        console.error('Error in loadSuggestions:', error)
        setError('Fehler beim Laden der Vorschläge')
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [user])

  const addSuggestion = async (suggestion: Omit<TaskSuggestion, 'id' | 'status' | 'createdAt'>) => {
    try {
      const newSuggestion = {
        ...suggestion,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      }

      if (user?.uid) {
        // Add to Firebase if user is authenticated
        await addDoc(collection(db, 'taskSuggestions'), newSuggestion)
      } else {
        // Add to localStorage for offline use
        const localSuggestion = {
          id: Date.now().toString(),
          ...newSuggestion
        }
        const updated = [...suggestions, localSuggestion]
        setSuggestions(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
    } catch (error) {
      console.error('Error adding suggestion:', error)
      throw new Error('Fehler beim Hinzufügen des Vorschlags')
    }
  }

  const updateSuggestionStatus = async (id: string, status: TaskSuggestion['status'], adminComments?: string) => {
    if (!user?.uid) {
      throw new Error('Anmeldung erforderlich')
    }

    try {
      const suggestionRef = doc(db, 'taskSuggestions', id)
      await updateDoc(suggestionRef, {
        status,
        adminComments: adminComments || '',
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating suggestion:', error)
      throw new Error('Fehler beim Aktualisieren des Vorschlags')
    }
  }

  const deleteSuggestion = async (id: string) => {
    if (!user?.uid) {
      throw new Error('Anmeldung erforderlich')
    }

    try {
      await deleteDoc(doc(db, 'taskSuggestions', id))
    } catch (error) {
      console.error('Error deleting suggestion:', error)
      throw new Error('Fehler beim Löschen des Vorschlags')
    }
  }

  const refreshSuggestions = () => {
    // Force reload from Firebase or localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setSuggestions(JSON.parse(saved))
    }
  }

  return (
    <TaskSuggestionsContext.Provider
      value={{
        suggestions,
        loading,
        error,
        addSuggestion,
        updateSuggestionStatus,
        deleteSuggestion,
        refreshSuggestions
      }}
    >
      {children}
    </TaskSuggestionsContext.Provider>
  )
}

export function useTaskSuggestions() {
  const context = useContext(TaskSuggestionsContext)
  if (context === undefined) {
    throw new Error('useTaskSuggestions must be used within a TaskSuggestionsProvider')
  }
  return context
}