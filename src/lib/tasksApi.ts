
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, type Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export type CategoryKey = 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess'

export interface Task {
  id?: string
  text: string
  category: CategoryKey
  createdAt?: Timestamp
  createdBy?: string
  status?: 'approved' | 'pending' | 'rejected'
}

export interface CreateTaskRequest {
  category: CategoryKey
  text: string
  createdBy: string
}

export async function createTaskApproved(taskData: CreateTaskRequest): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      text: taskData.text,
      category: taskData.category,
      status: 'approved',
      createdBy: taskData.createdBy,
      createdAt: serverTimestamp()
    })
    
    console.log('✅ Task created successfully:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Failed to create task:', error)
    throw error
  }
}

export async function listApprovedTasks(category?: CategoryKey): Promise<Task[]> {
  try {
    const tasksRef = collection(db, 'tasks')
    const tasksQuery = category
      ? query(tasksRef, 
          where('category', '==', category), 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        )
      : query(tasksRef, 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        )

    const snapshot = await getDocs(tasksQuery)
    const tasks: Task[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      tasks.push({
        id: doc.id,
        text: data.text,
        category: data.category,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        status: data.status
      })
    })

    console.log('✅ Tasks loaded successfully:', tasks.length)
    return tasks
  } catch (error) {
    console.error('❌ Failed to load tasks:', error)
    throw error
  }
}
