
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { challenges } from '../features/Arena/challenges'

export interface Suggestion {
  id: string
  categoryId: string
  text: string
  timestamp: number
}

export interface ApprovedTask {
  id: string
  categoryId: string
  text: string
  timestamp: number
}

interface TaskSuggestionsContextType {
  pending: Suggestion[]
  approved: ApprovedTask[]
  localAdmin: boolean
  addSuggestion: (categoryId: string, text: string) => boolean
  approve: (suggestionId: string) => void
  reject: (suggestionId: string) => void
  toggleLocalAdmin: () => void
  getMergedTasks: (categoryId: string) => string[]
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | undefined>(undefined)

export function TaskSuggestionsProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Suggestion[]>([])
  const [approved, setApproved] = useState<ApprovedTask[]>([])
  const [localAdmin, setLocalAdmin] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const storedPending = localStorage.getItem('mallex.pendingSuggestions')
    const storedApproved = localStorage.getItem('mallex.approvedTasks')
    const storedLocalAdmin = localStorage.getItem('mallex.localAdmin')

    if (storedPending) {
      try {
        setPending(JSON.parse(storedPending))
      } catch (e) {
        console.error('Failed to parse pending suggestions:', e)
      }
    }

    if (storedApproved) {
      try {
        setApproved(JSON.parse(storedApproved))
      } catch (e) {
        console.error('Failed to parse approved tasks:', e)
      }
    }

    setLocalAdmin(storedLocalAdmin === 'true')
  }, [])

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('mallex.pendingSuggestions', JSON.stringify(pending))
  }, [pending])

  useEffect(() => {
    localStorage.setItem('mallex.approvedTasks', JSON.stringify(approved))
  }, [approved])

  useEffect(() => {
    localStorage.setItem('mallex.localAdmin', String(localAdmin))
  }, [localAdmin])

  const addSuggestion = (categoryId: string, text: string): boolean => {
    const trimmedText = text.trim()
    
    if (trimmedText.length < 8) return false
    
    // Check for duplicates (case-insensitive)
    const isDuplicate = pending.some(s => 
      s.categoryId === categoryId && 
      s.text.toLowerCase() === trimmedText.toLowerCase()
    )
    
    if (isDuplicate) return false

    const newSuggestion: Suggestion = {
      id: Date.now().toString(),
      categoryId,
      text: trimmedText,
      timestamp: Date.now()
    }

    setPending(prev => [...prev, newSuggestion])
    return true
  }

  const approve = (suggestionId: string) => {
    const suggestion = pending.find(s => s.id === suggestionId)
    if (!suggestion) return

    const approvedTask: ApprovedTask = {
      id: suggestion.id,
      categoryId: suggestion.categoryId,
      text: suggestion.text,
      timestamp: Date.now()
    }

    setApproved(prev => [...prev, approvedTask])
    setPending(prev => prev.filter(s => s.id !== suggestionId))
  }

  const reject = (suggestionId: string) => {
    setPending(prev => prev.filter(s => s.id !== suggestionId))
  }

  const toggleLocalAdmin = () => {
    setLocalAdmin(prev => !prev)
  }

  const getMergedTasks = (categoryId: string): string[] => {
    const baseTasks = challenges[categoryId] || []
    const approvedTexts = approved
      .filter(task => task.categoryId === categoryId)
      .map(task => task.text)
    
    return [...baseTasks, ...approvedTexts]
  }

  const value: TaskSuggestionsContextType = {
    pending,
    approved,
    localAdmin,
    addSuggestion,
    approve,
    reject,
    toggleLocalAdmin,
    getMergedTasks
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
    throw new Error('useTaskSuggestions must be used within a TaskSuggestionsProvider')
  }
  return context
}
