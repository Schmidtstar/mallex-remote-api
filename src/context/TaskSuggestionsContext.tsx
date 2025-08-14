import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAdmin } from './AdminContext'

export interface TaskSuggestion {
  id: string
  text: string
  category: string
  authorId: string
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected'
}

// Assuming ApprovedTask interface is needed for the modified part, though not provided in original
// If it's not defined elsewhere, this might cause an error. For now, I'll assume it exists.
interface ApprovedTask {
  id: string;
  text: string;
  category: string;
  authorId: string;
  createdAt: Date;
  // other properties if any
}

interface TaskSuggestionsContextType {
  suggestions: TaskSuggestion[]
  loading: boolean
  error: string | null
  addSuggestion: (text: string, category: string) => Promise<void>
  updateSuggestionStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>
  // Potentially expose approvedTasks and related loading/error states if needed
  // approvedTasks: ApprovedTask[];
  // approvedTasksLoading: boolean;
  // approvedTasksError: string | null;
  // loadApprovedTasks: (category?: string) => Promise<void>;
}

const TaskSuggestionsContext = createContext<TaskSuggestionsContextType | null>(null)

const STORAGE_KEY = 'mallex_task_suggestions'

// Define the props for TaskSuggestionsProvider
interface TaskSuggestionsProviderProps {
  children: ReactNode;
}

export function TaskSuggestionsProvider({ children }: TaskSuggestionsProviderProps) {
  const { user } = useAuth()
  const { isAdmin } = useAdmin() // Get admin status from context
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State and function for approved tasks, which are being modified
  const [approvedTasks, setApprovedTasks] = useState<ApprovedTask[]>([])
  const [approvedTasksLoading, setApprovedTasksLoading] = useState(true)
  const [approvedTasksError, setApprovedTasksError] = useState<string | null>(null)


  useEffect(() => {
    // Only load suggestions if the user is an admin or if no user is logged in (for fallback)
    if (!user?.uid && !user) { // Allow loading if no user for local fallback
      const loadSuggestions = async () => {
        setLoading(true)
        setError(null) // Clear previous errors
        try {
          // If no user, fall back to localStorage
          const saved = localStorage.getItem(STORAGE_KEY)
          const suggestionsList = saved ? JSON.parse(saved) : []

          const parsed = suggestionsList.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt)
          }))
          setSuggestions(parsed)
          setLoading(false)
        } catch (localStorageError) {
          console.warn('Failed to load suggestions from localStorage:', localStorageError)
          setSuggestions([]) // Clear if localStorage also fails
          setLoading(false)
        }
      }
      loadSuggestions()
      return
    }

    // If user is logged in, proceed only if they are an admin
    if (user?.uid && isAdmin) {
      const loadSuggestions = async () => {
        setLoading(true)
        setError(null) // Clear previous errors
        try {
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
    } else if (user?.uid && !isAdmin) {
      // If user is logged in but not admin, clear suggestions and set error
      setSuggestions([])
      setError('Access denied: Only admins can view task suggestions.')
      setLoading(false)
    }
  }, [user?.uid, isAdmin]) // Re-run when auth state or admin status changes

  const addSuggestion = async (text: string, category: string) => {
    // Only allow adding suggestions if user is logged in and is an admin
    if (!user?.uid || !isAdmin) {
      // Optionally, inform the user they don't have permission
      console.warn('Operation not permitted: Only admins can add task suggestions.')
      return;
    }

    const newSuggestion: TaskSuggestion = {
      id: Date.now().toString(), // Using timestamp as a simple ID for local-first
      text: text.trim(),
      category,
      authorId: user?.uid || 'anonymous', // Should always have user.uid here if !isAdmin check passes
      createdAt: new Date(),
      status: 'pending'
    }

    const updated = [...suggestions, newSuggestion]
    setSuggestions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // TODO: Add Firebase persistence for new suggestions if user is online and admin
    // if (user && isAdmin) {
    //   try {
    //     await addDoc(collection(db, 'taskSuggestions'), { ...newSuggestion, createdAt: serverTimestamp() });
    //   } catch (error) {
    //     console.error("Error adding suggestion to Firebase:", error);
    //     setError("Failed to save suggestion to server.");
    //   }
    // }
  }

  const updateSuggestionStatus = async (id: string, status: 'approved' | 'rejected') => {
    // Only allow updating status if user is logged in and is an admin
    if (!user?.uid || !isAdmin) {
      // Optionally, inform the user they don't have permission
      console.warn('Operation not permitted: Only admins can update suggestion status.')
      return;
    }

    const updated = suggestions.map(s =>
      s.id === id ? { ...s, status } : s
    )
    setSuggestions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // TODO: Add Firebase persistence for status updates if user is online and admin
    // if (user && isAdmin) {
    //   try {
    //     const docRef = doc(db, 'taskSuggestions', id); // Assuming 'id' is the Firestore document ID
    //     await updateDoc(docRef, { status });
    //   } catch (error) {
    //     console.error("Error updating suggestion status in Firebase:", error);
    //     setError("Failed to update suggestion status on server.");
    //   }
    // }
  }

  // Cache for better performance
  const taskCache = new Map<string, { tasks: ApprovedTask[], timestamp: number }>()
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const loadApprovedTasks = async (category?: string) => {
    // This function should only be callable by admins.
    if (!isAdmin) {
      console.warn('Operation not permitted: Only admins can load approved tasks.')
      setApprovedTasks([]) // Clear tasks if not admin
      setApprovedTasksError('Access denied: Only admins can view approved tasks.')
      setApprovedTasksLoading(false)
      return
    }

    const cacheKey = category || 'all'
    const cached = taskCache.get(cacheKey)

    // Check cache
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setApprovedTasks(cached.tasks)
      console.log('✅ Tasks loaded from cache:', cached.tasks.length)
      setApprovedTasksLoading(false) // Ensure loading state is false after cache hit
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
            limit(50) // Pagination: only load 50 tasks
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
        // This message might be misleading if the problem is elsewhere, but keeping as is from original
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
    // Expose approved tasks and related states/functions if they are meant to be consumed by children
    // approvedTasks,
    // approvedTasksLoading,
    // approvedTasksError,
    // loadApprovedTasks,
  }

  // The provided code did not originally export AdminSettingsProvider or useAdminSettings.
  // If those were intended to be part of this file and causing export conflicts,
  // that context is missing from the provided original code.
  // This provider focuses solely on TaskSuggestionsContext.

  return (
    <TaskSuggestionsContext.Provider value={value}>
      {children}
    </TaskSuggestionsContext.Provider>
  )
}

// Hook with consistent export for Fast Refresh
export function useTaskSuggestions() {
  const context = useContext(TaskSuggestionsContext)
  if (!context) {
    throw new Error('useTaskSuggestions must be used within TaskSuggestionsProvider')
  }
  return context
}