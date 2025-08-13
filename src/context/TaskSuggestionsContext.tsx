import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface TaskSuggestion {
  id: string
  text: string
  category: string
  authorId: string
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected'
}

interface TaskSuggestionsContextType {
  suggestions: TaskSuggestion[]
  loading: boolean
  error: string | null
  addSuggestion: (text: string, category: string) => Promise<void>
  updateSuggestionStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | null>(null)

const STORAGE_KEY = 'mallex_task_suggestions'

export function TaskSuggestionsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    const loadSuggestions = async () => {
      setLoading(true)
      setError(null) // Clear previous errors
      try {
        if (!user) {
          // If no user, fall back to localStorage
          const saved = localStorage.getItem(STORAGE_KEY)
          const suggestionsList = saved ? JSON.parse(saved) : []

          const parsed = suggestionsList.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt)
          }))
          setSuggestions(parsed)
          setLoading(false)
          return
        }

        // Attempt to fetch from Firebase
        const q = query(collection(db, 'taskSuggestions'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSuggestion)))
        setLoading(false)
      } catch (error: any) {
        console.error('Error fetching suggestions:', error)
        // Handle specific Firebase errors
        if (error?.code === 'unavailable' || error?.code === 'permission-denied') {
          console.warn('🔄 Firebase unavailable or permission denied - using offline fallback')
          // Fallback to localStorage if Firebase fails
          try {
            const saved = localStorage.getItem(STORAGE_KEY)
            const suggestionsList = saved ? JSON.parse(saved) : []

            const parsed = suggestionsList.map((s: any) => ({
              ...s,
              createdAt: new Date(s.createdAt)
            }))
            setSuggestions(parsed)
          } catch (localStorageError) {
            console.warn('Failed to load suggestions from localStorage:', localStorageError)
            setSuggestions([]) // Clear if localStorage also fails
          }
        } else {
          setError('Failed to load suggestions: ' + (error?.message || 'Unknown error'))
        }
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [authLoading, user]) // Re-run when authLoading or user changes

  const addSuggestion = async (text: string, category: string) => {
    const newSuggestion: TaskSuggestion = {
      id: Date.now().toString(), // Using timestamp as a simple ID for local-first
      text: text.trim(),
      category,
      authorId: user?.uid || 'anonymous',
      createdAt: new Date(),
      status: 'pending'
    }

    const updated = [...suggestions, newSuggestion]
    setSuggestions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // TODO: Add Firebase persistence for new suggestions if user is online
    // if (user) {
    //   try {
    //     await addDoc(collection(db, 'taskSuggestions'), { ...newSuggestion, createdAt: serverTimestamp() });
    //   } catch (error) {
    //     console.error("Error adding suggestion to Firebase:", error);
    //     setError("Failed to save suggestion to server.");
    //   }
    // }
  }

  const updateSuggestionStatus = async (id: string, status: 'approved' | 'rejected') => {
    const updated = suggestions.map(s =>
      s.id === id ? { ...s, status } : s
    )
    setSuggestions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // TODO: Add Firebase persistence for status updates if user is online
    // if (user) {
    //   try {
    //     const docRef = doc(db, 'taskSuggestions', id); // Assuming 'id' is the Firestore document ID
    //     await updateDoc(docRef, { status });
    //   } catch (error) {
    //     console.error("Error updating suggestion status in Firebase:", error);
    //     setError("Failed to update suggestion status on server.");
    //   }
    // }
  }

  const value: TaskSuggestionsContextType = {
    suggestions,
    loading,
    error,
    addSuggestion,
    updateSuggestionStatus
  }

  return (
    <TaskSuggestionsContext.Provider value={value}>
      {children}
    </TaskSuggestionsContext.Provider>
  )
}

// Hook mit konsistentem Export für Fast Refresh
export function useTaskSuggestions() {
  const context = useContext(TaskSuggestionsContext)
  if (!context) {
    throw new Error('useTaskSuggestions must be used within TaskSuggestionsProvider')
  }
  return context
}