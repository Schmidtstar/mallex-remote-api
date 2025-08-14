
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface TaskSuggestion {
  id: string
  text: string
  category: string
  authorId: string
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected'
}

interface ApprovedTask {
  id: string;
  text: string;
  category: string;
  authorId: string;
  createdAt: Date;
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

interface TaskSuggestionsProviderProps {
  children: ReactNode;
}

export function TaskSuggestionsProvider({ children }: TaskSuggestionsProviderProps) {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [approvedTasks, setApprovedTasks] = useState<ApprovedTask[]>([])
  const [approvedTasksLoading, setApprovedTasksLoading] = useState(true)
  const [approvedTasksError, setApprovedTasksError] = useState<string | null>(null)

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        if (!user?.uid) {
          // If no user, fall back to localStorage
          const saved = localStorage.getItem(STORAGE_KEY)
          const suggestionsList = saved ? JSON.parse(saved) : []

          const parsed = suggestionsList.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt)
          }))
          setSuggestions(parsed)
        } else {
          // If user is logged in, try Firebase first
          try {
            const q = query(collection(db, 'taskSuggestions'), orderBy('createdAt', 'desc'))
            const snapshot = await getDocs(q)
            setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSuggestion)))
          } catch (firebaseError: any) {
            console.warn('Firebase unavailable - using localStorage fallback:', firebaseError)
            
            // Fallback to localStorage if Firebase fails
            const saved = localStorage.getItem(STORAGE_KEY)
            const suggestionsList = saved ? JSON.parse(saved) : []

            const parsed = suggestionsList.map((s: any) => ({
              ...s,
              createdAt: new Date(s.createdAt)
            }))
            setSuggestions(parsed)
          }
        }
      } catch (error: any) {
        console.error('Error loading suggestions:', error)
        setError('Failed to load suggestions: ' + (error?.message || 'Unknown error'))
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [user?.uid])

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

  // Cache for better performance
  const taskCache = new Map<string, { tasks: ApprovedTask[], timestamp: number }>()
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const loadApprovedTasks = async (category?: string) => {
    const cacheKey = category || 'all'
    const cached = taskCache.get(cacheKey)

    // Check cache
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setApprovedTasks(cached.tasks)
      console.log('✅ Tasks loaded from cache:', cached.tasks.length)
      setApprovedTasksLoading(false)
      return
    }

    setApprovedTasksLoading(true)
    setApprovedTasksError(null)

    try {
      const tasksRef = collection(db, 'approvedTasks')
      const tasksQuery = category
        ? query(tasksRef,
            where('category', '==', category),
            orderBy('createdAt', 'desc'),
            limit(50)
          )
        : query(tasksRef,
            orderBy('createdAt', 'desc'),
            limit(50)
          )

      const snapshot = await getDocs(tasksQuery)
      const tasks: ApprovedTask[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as ApprovedTask)
      })

      // Update cache
      taskCache.set(cacheKey, { tasks, timestamp: Date.now() })

      setApprovedTasks(tasks)
      console.log('✅ Tasks loaded successfully:', tasks.length)
    } catch (error: any) {
      console.error('Failed to load approved tasks:', error)
      if (error?.code === 'permission-denied') {
        setApprovedTasksError('📝 No approved tasks found in Firebase')
      } else {
        setApprovedTasksError('Fehler beim Laden der Tasks: ' + (error?.message || 'Unbekannter Fehler'))
      }
      setApprovedTasks([])
    } finally {
      setApprovedTasksLoading(false)
    }
  }

  const value: TaskSuggestionsContextType = {
    suggestions,
    loading,
    error,
    addSuggestion,
    updateSuggestionStatus,
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
