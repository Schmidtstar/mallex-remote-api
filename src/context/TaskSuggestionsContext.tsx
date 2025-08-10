
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getFirebase } from '../lib/firebase'

export type TaskSuggestion = {
  id: string
  categoryId: 'fate' | 'seduce' | 'confess' | 'escalate' | 'shame'
  text: string
  authorUid?: string
  authorName?: string
  createdAt: number
  status: 'pending' | 'approved' | 'rejected'
  reviewerUid?: string
  reviewedAt?: number
  note?: string
}

export type CustomChallenges = Record<string, string[]>

type TaskSuggestionsCtx = {
  suggestions: TaskSuggestion[]
  customChallenges: CustomChallenges
  addSuggestion: (categoryId: string, text: string) => Promise<void>
  approveSuggestion: (id: string, note?: string) => Promise<void>
  rejectSuggestion: (id: string, note?: string) => Promise<void>
  addCustomChallenge: (categoryId: string, text: string) => Promise<void>
  removeCustomChallenge: (categoryId: string, index: number) => Promise<void>
  loadData: () => Promise<void>
}

const defaultContext: TaskSuggestionsCtx = {
  suggestions: [],
  customChallenges: {},
  addSuggestion: async () => {},
  approveSuggestion: async () => {},
  rejectSuggestion: async () => {},
  addCustomChallenge: async () => {},
  removeCustomChallenge: async () => {},
  loadData: async () => {}
}

const TaskSuggestionsContext = createContext<TaskSuggestionsCtx>(defaultContext)

export const useTaskSuggestions = () => {
  const ctx = useContext(TaskSuggestionsContext)
  if (!ctx || ctx === defaultContext) throw new Error('useTaskSuggestions must be used within TaskSuggestionsProvider')
  return ctx
}

export function TaskSuggestionsProvider({ children }: { children: ReactNode }) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [customChallenges, setCustomChallenges] = useState<CustomChallenges>({})
  const { user, mode } = useAuth()

  const loadData = useCallback(async () => {
    try {
      // Only use Firestore for authenticated non-anonymous users
      if (mode === 'firebase' && user && !user.isAnonymous) {
        const fb = await getFirebase()
        if (fb) {
          const { getFirestore, collection, getDocs } = await import('firebase/firestore')
          const firestore = getFirestore(fb.app)
          
          // Load suggestions
          const suggestionsSnap = await getDocs(collection(firestore, 'taskSuggestions'))
          const loadedSuggestions: TaskSuggestion[] = []
          suggestionsSnap.forEach(doc => {
            loadedSuggestions.push({ id: doc.id, ...doc.data() } as TaskSuggestion)
          })
          setSuggestions(loadedSuggestions)
          
          // Load custom challenges
          const challengesSnap = await getDocs(collection(firestore, 'customChallenges'))
          const loadedChallenges: CustomChallenges = {}
          challengesSnap.forEach(doc => {
            loadedChallenges[doc.id] = doc.data().challenges || []
          })
          setCustomChallenges(loadedChallenges)
          return
        }
      }
      
      // Fallback to localStorage
      const savedSuggestions = localStorage.getItem('mallex.taskSuggestions')
      if (savedSuggestions) {
        setSuggestions(JSON.parse(savedSuggestions))
      }
      
      const savedCustom = localStorage.getItem('mallex.customChallenges')
      if (savedCustom) {
        setCustomChallenges(JSON.parse(savedCustom))
      }
    } catch (error) {
      console.warn('Failed to load task data, using localStorage fallback:', error)
      const savedSuggestions = localStorage.getItem('mallex.taskSuggestions')
      const savedCustom = localStorage.getItem('mallex.customChallenges')
      if (savedSuggestions) setSuggestions(JSON.parse(savedSuggestions))
      if (savedCustom) setCustomChallenges(JSON.parse(savedCustom))
    }
  }, [user, mode])

  const saveData = useCallback(async () => {
    try {
      // Always save to localStorage as fallback
      localStorage.setItem('mallex.taskSuggestions', JSON.stringify(suggestions))
      localStorage.setItem('mallex.customChallenges', JSON.stringify(customChallenges))
      
      // Only save to Firestore for authenticated non-anonymous users
      if (mode === 'firebase' && user && !user.isAnonymous) {
        const fb = await getFirebase()
        if (fb) {
          const { getFirestore, doc, setDoc } = await import('firebase/firestore')
          const firestore = getFirestore(fb.app)
          
          // Save suggestions
          for (const suggestion of suggestions) {
            const docRef = doc(firestore, 'taskSuggestions', suggestion.id)
            await setDoc(docRef, suggestion)
          }
          
          // Save custom challenges
          for (const [categoryId, challenges] of Object.entries(customChallenges)) {
            if (challenges.length > 0) {
              const docRef = doc(firestore, 'customChallenges', categoryId)
              await setDoc(docRef, { challenges })
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to save to Firestore, saved locally:', error)
    }
  }, [suggestions, customChallenges, user, mode])

  const addSuggestion = useCallback(async (categoryId: string, text: string) => {
    const newSuggestion: TaskSuggestion = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      categoryId: categoryId as TaskSuggestion['categoryId'],
      text,
      authorUid: user?.uid,
      authorName: user?.email || 'Anonymous',
      createdAt: Date.now(),
      status: 'pending'
    }
    
    setSuggestions(prev => [...prev, newSuggestion])
  }, [user])

  const approveSuggestion = useCallback(async (id: string, note?: string) => {
    const suggestion = suggestions.find(s => s.id === id)
    if (!suggestion) return
    
    // Move to custom challenges
    setCustomChallenges(prev => ({
      ...prev,
      [suggestion.categoryId]: [...(prev[suggestion.categoryId] || []), suggestion.text]
    }))
    
    // Update suggestion status
    setSuggestions(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status: 'approved' as const, reviewerUid: user?.uid, reviewedAt: Date.now(), note }
        : s
    ))
  }, [suggestions, user])

  const rejectSuggestion = useCallback(async (id: string, note?: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status: 'rejected' as const, reviewerUid: user?.uid, reviewedAt: Date.now(), note }
        : s
    ))
  }, [user])

  const addCustomChallenge = useCallback(async (categoryId: string, text: string) => {
    setCustomChallenges(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), text]
    }))
  }, [])

  const removeCustomChallenge = useCallback(async (categoryId: string, index: number) => {
    setCustomChallenges(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter((_, i) => i !== index)
    }))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (suggestions.length > 0 || Object.keys(customChallenges).length > 0) {
      saveData()
    }
  }, [suggestions, customChallenges, saveData])

  const api = useMemo<TaskSuggestionsCtx>(() => ({
    suggestions,
    customChallenges,
    addSuggestion,
    approveSuggestion,
    rejectSuggestion,
    addCustomChallenge,
    removeCustomChallenge,
    loadData
  }), [suggestions, customChallenges, addSuggestion, approveSuggestion, rejectSuggestion, addCustomChallenge, removeCustomChallenge, loadData])

  return (
    <TaskSuggestionsContext.Provider value={api}>
      {children}
    </TaskSuggestionsContext.Provider>
  )
}
