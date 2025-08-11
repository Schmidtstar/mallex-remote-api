
import { db } from './firebase'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'

export type TaskDoc = {
  id?: string
  category: 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess'
  text: string
  status: 'approved' | 'pending' | 'rejected'
  createdBy?: string
  createdAt?: any
  hidden?: boolean
}

export async function createTaskApproved(
  input: Pick<TaskDoc, 'category' | 'text'>, 
  createdBy?: string
): Promise<void> {
  await addDoc(collection(db, 'tasks'), {
    ...input,
    status: 'approved' as const,
    createdBy: createdBy ?? null,
    createdAt: serverTimestamp(),
    hidden: false,
  })
}

export async function fetchApprovedTasksByCategory(
  category: TaskDoc['category']
): Promise<TaskDoc[]> {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('category', '==', category),
      where('status', '==', 'approved')
    )

    const snap = await getDocs(q)
    return snap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<TaskDoc, 'id'>)
    }))
  } catch (error) {
    console.error('Error fetching approved tasks:', error)
    return []
  }
}

export async function fetchAllApprovedTasks(): Promise<TaskDoc[]> {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('status', '==', 'approved')
    )

    const snap = await getDocs(q)
    return snap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<TaskDoc, 'id'>)
    }))
  } catch (error) {
    console.error('Error fetching all approved tasks:', error)
    return []
  }
}
