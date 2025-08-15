
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface TaskSuggestion {
  id: string
  userId: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  adminFeedback?: string
}

interface TaskSuggestionsContextType {
  suggestions: TaskSuggestion[]
  loading: boolean
  error: string | null
  addSuggestion: (suggestion: Omit<TaskSuggestion, 'id' | 'userId' | 'createdAt' | 'status'>) => Promise<void>
  refreshSuggestions: () => Promise<void>
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | null>(null)

export function TaskSuggestionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() // ✅ Hook INNERHALB der Komponente
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('TaskSuggestionsProvider initialized for user:', user?.uid || 'anonymous')

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Simuliere Laden der Vorschläge
        const mockSuggestions: TaskSuggestion[] = []
        setSuggestions(mockSuggestions)
      } catch (err) {
        console.error('Error loading suggestions:', err)
        setError('Fehler beim Laden der Vorschläge')
      } finally {
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [user])

  const addSuggestion = async (suggestion: Omit<TaskSuggestion, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    if (!user) {
      throw new Error('Benutzer muss angemeldet sein')
    }

    try {
      const newSuggestion: TaskSuggestion = {
        ...suggestion,
        id: Date.now().toString(),
        userId: user.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      setSuggestions(prev => [...prev, newSuggestion])
    } catch (err) {
      console.error('Error adding suggestion:', err)
      throw new Error('Fehler beim Hinzufügen des Vorschlags')
    }
  }

  const refreshSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock refresh
      const mockSuggestions: TaskSuggestion[] = []
      setSuggestions(mockSuggestions)
    } catch (err) {
      console.error('Error refreshing suggestions:', err)
      setError('Fehler beim Aktualisieren der Vorschläge')
    } finally {
      setLoading(false)
    }
  }

  const value: TaskSuggestionsContextType = {
    suggestions,
    loading,
    error,
    addSuggestion,
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
