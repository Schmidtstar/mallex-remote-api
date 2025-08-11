
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'edited'

export interface TaskSuggestion {
  id: string
  categoryId: string
  text: string
  status: SuggestionStatus
  note?: string
  author?: { uid?: string; email?: string | null }
  createdAt: number
  updatedAt: number
}

interface TaskSuggestionsContextType {
  items: TaskSuggestion[]
  add: (categoryId: string, text: string, author?: { uid?: string; email?: string | null }) => void
  approve: (id: string) => void
  reject: (id: string, note?: string) => void
  edit: (id: string, patch: Partial<Pick<TaskSuggestion, 'text' | 'categoryId' | 'note'>>) => void
  remove: (id: string) => void
  clear: () => void
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | null>(null)

const STORAGE_KEY = 'taskSuggestions'

export function TaskSuggestionsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TaskSuggestion[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load task suggestions:', error)
    }
  }, [])

  // Save to localStorage when items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save task suggestions:', error)
    }
  }, [items])

  const add = (categoryId: string, text: string, author?: { uid?: string; email?: string | null }) => {
    const newSuggestion: TaskSuggestion = {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      categoryId,
      text,
      status: 'pending',
      author,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setItems(prev => [...prev, newSuggestion])
  }

  const approve = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'approved' as SuggestionStatus, updatedAt: Date.now() }
        : item
    ))
  }

  const reject = (id: string, note?: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'rejected' as SuggestionStatus, note, updatedAt: Date.now() }
        : item
    ))
  }

  const edit = (id: string, patch: Partial<Pick<TaskSuggestion, 'text' | 'categoryId' | 'note'>>) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...patch, status: 'edited' as SuggestionStatus, updatedAt: Date.now() }
        : item
    ))
  }

  const remove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const clear = () => {
    setItems([])
  }

  return (
    <TaskSuggestionsContext.Provider value={{
      items,
      add,
      approve,
      reject,
      edit,
      remove,
      clear
    }}>
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
