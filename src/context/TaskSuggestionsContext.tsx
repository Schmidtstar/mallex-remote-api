import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

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
  addSuggestion: (text: string, category: string) => Promise<void>
  updateSuggestionStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | null>(null)

const STORAGE_KEY = 'mallex_task_suggestions'

export function TaskSuggestionsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  // FORCE localStorage-only mode (no Firebase until rules are fixed)
  useEffect(() => {
    if (authLoading) return

    setLoading(true)
    try {
      // Always use localStorage - no Firebase listeners
      const saved = localStorage.getItem(STORAGE_KEY)
      const suggestionsList = saved ? JSON.parse(saved) : []

      // Convert dates back from JSON
      const parsed = suggestionsList.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }))

      setSuggestions(parsed)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to load suggestions from localStorage:', error)
      }
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [authLoading])

  const addSuggestion = async (text: string, category: string) => {
    const newSuggestion: TaskSuggestion = {
      id: Date.now().toString(),
      text: text.trim(),
      category,
      authorId: user?.uid || 'anonymous',
      createdAt: new Date(),
      status: 'pending'
    }

    const updated = [...suggestions, newSuggestion]
    setSuggestions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const updateSuggestionStatus = async (id: string, status: 'approved' | 'rejected') => {
    const updated = suggestions.map(s =>
      s.id === id ? { ...s, status } : s
    )
    setSuggestions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const value: TaskSuggestionsContextType = {
    suggestions,
    loading,
    addSuggestion,
    updateSuggestionStatus
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