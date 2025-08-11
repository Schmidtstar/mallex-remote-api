
import { db } from './firebase'

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
  const fb = await getFirebase()
  if (!fb) {
    throw new Error('Firebase nicht verfügbar')
  }

  const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore')
  const db = getFirestore(fb.app)

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
  const fb = await getFirebase()
  if (!fb) {
    return []
  }

  try {
    const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore')
    const db = getFirestore(fb.app)

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
  const fb = await getFirebase()
  if (!fb) {
    return []
  }

  try {
    const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore')
    const db = getFirestore(fb.app)

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
