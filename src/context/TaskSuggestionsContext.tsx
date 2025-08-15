import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface TaskSuggestion {
  id: string
  text: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  authorId: string
  authorName?: string
  adminNote?: string
  isVisible?: boolean
}

interface TaskSuggestionsContextType {
  suggestions: TaskSuggestion[]
  tasks: TaskSuggestion[]
  loading: boolean
  error: string | null
  addSuggestion: (text: string, category: string) => Promise<void>
  refreshSuggestions: () => Promise<void>
  approveSuggestion: (id: string) => Promise<void>
  rejectSuggestion: (id: string, note?: string) => Promise<void>
  toggleTaskVisibility: (id: string) => Promise<void>
  updateTask: (id: string, updates: Partial<TaskSuggestion>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  createTask: (text: string, category: string) => Promise<void>
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | undefined>(undefined)

export function TaskSuggestionsProvider({ children }: { children: ReactNode }) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [tasks, setTasks] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mockData: TaskSuggestion[] = [
    {
      id: 'task-1',
      text: 'Mache 20 Liegestütze am Stück',
      category: 'Fitness',
      status: 'approved',
      createdAt: new Date(),
      authorId: 'admin',
      authorName: 'Admin',
      isVisible: true
    },
    {
      id: 'task-2',
      text: 'Laufe 30 Minuten ohne Pause',
      category: 'Ausdauer',
      status: 'approved',
      createdAt: new Date(),
      authorId: 'admin',
      authorName: 'Admin',
      isVisible: true
    }
  ]

  // Mock useAuth hook - replace with actual implementation
  const useAuth = () => {
    // Assuming a user object and isAdmin flag are available
    const user = { uid: 'user-123', displayName: 'Test User' };
    const isAdmin = true; // Or false, depending on the user
    return { user, isAdmin };
  };

  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!user?.uid) {
      console.log('❌ No user - TaskSuggestions context inactive');
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Prevent multiple initializations for the same user
    if (suggestions.length > 0 && !loading) {
      console.log('✅ TaskSuggestions already loaded for user:', user.uid);
      return;
    }

    console.log('TaskSuggestionsProvider initialized for user:', user.uid);
    loadSuggestions();
  }, [user?.uid]);

  const loadSuggestions = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      setError(null)

      // Simulate loading suggestions
      const mockSuggestions: TaskSuggestion[] = []
      setSuggestions(mockSuggestions)

      // Load tasks (from Firebase and localStorage)
      try {
        console.log('🔄 Firebase empty, falling back to localStorage with demo data')

        const storedSuggestions = localStorage.getItem(`suggestions_${user.uid}`)
        const parsedSuggestions = storedSuggestions ? JSON.parse(storedSuggestions) : []
        console.log('📦 localStorage suggestions loaded:', parsedSuggestions.length)

        setSuggestions(parsedSuggestions)
        setTasks(mockData)
        console.log('✅ Direct tasks loaded:', mockData.length)
      } catch (fbError) {
        console.warn('Firebase load failed, using localStorage:', fbError)

        const storedSuggestions = localStorage.getItem(`suggestions_${user.uid}`)
        const parsedSuggestions = storedSuggestions ? JSON.parse(storedSuggestions) : []

        setSuggestions(parsedSuggestions)
        setTasks(mockData)
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
      setError('Fehler beim Laden der Vorschläge')
    } finally {
      setLoading(false)
    }
  }

  const refreshSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock refresh
      const mockSuggestions: TaskSuggestion[] = []
      setSuggestions(mockSuggestions)
      setTasks(mockData)
    } catch (error) {
      console.error('Error refreshing suggestions:', error)
      setError('Fehler beim Aktualisieren')
    } finally {
      setLoading(false)
    }
  }

  const addSuggestion = async (text: string, category: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const newSuggestion: TaskSuggestion = {
        id: Date.now().toString(),
        text,
        category,
        status: 'pending',
        createdAt: new Date(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonym'
      }

      // Save to localStorage
      const currentSuggestions = [...suggestions, newSuggestion]
      localStorage.setItem(`suggestions_${user.uid}`, JSON.stringify(currentSuggestions))
      setSuggestions(currentSuggestions)
    } catch (error) {
      console.error('Error adding suggestion:', error)
      throw new Error('Fehler beim Hinzufügen des Vorschlags')
    }
  }

  const approveSuggestion = async (id: string) => {
    if (!isAdmin) throw new Error('Admin rights required')

    const suggestion = suggestions.find(s => s.id === id)
    if (!suggestion) throw new Error('Suggestion not found')

    const approvedTask: TaskSuggestion = {
      ...suggestion,
      status: 'approved',
      isVisible: true
    }

    setTasks(prev => [...prev, approvedTask])
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }

  const rejectSuggestion = async (id: string, note?: string) => {
    if (!isAdmin) throw new Error('Admin rights required')
    setSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'rejected', adminNote: note } : s
    ))
  }

  const toggleTaskVisibility = async (id: string) => {
    if (!isAdmin) throw new Error('Admin rights required')
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, isVisible: !task.isVisible } : task
    ))
  }

  const updateTask = async (id: string, updates: Partial<TaskSuggestion>) => {
    if (!isAdmin) throw new Error('Admin rights required')
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ))
  }

  const deleteTask = async (id: string) => {
    if (!isAdmin) throw new Error('Admin rights required')
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  const createTask = async (text: string, category: string) => {
    if (!isAdmin) throw new Error('Admin rights required')

    const newTask: TaskSuggestion = {
      id: Date.now().toString(),
      text,
      category,
      status: 'approved',
      createdAt: new Date(),
      authorId: user?.uid || 'admin',
      authorName: user?.displayName || 'Admin',
      isVisible: true
    }

    setTasks(prev => [...prev, newTask])
  }

  const contextValue = useMemo(() => ({
    suggestions,
    tasks,
    loading,
    error,
    addSuggestion,
    refreshSuggestions,
    approveSuggestion,
    rejectSuggestion,
    toggleTaskVisibility,
    updateTask,
    deleteTask,
    createTask
  }), [suggestions, tasks, loading, error, addSuggestion, refreshSuggestions, approveSuggestion, rejectSuggestion, toggleTaskVisibility, updateTask, deleteTask, createTask]);

  return (
    <TaskSuggestionsContext.Provider value={contextValue}>
      {children}
    </TaskSuggestionsContext.Provider>
  )
}

export const useTaskSuggestions = () => {
  const context = useContext(TaskSuggestionsContext)
  if (context === undefined) {
    throw new Error('useTaskSuggestions must be used within a TaskSuggestionsProvider')
  }
  return context
}