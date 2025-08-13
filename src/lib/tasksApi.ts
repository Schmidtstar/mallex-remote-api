import { db } from '@/lib/firebase';
import { col } from '@/lib/paths';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';

export type TaskStatus = 'approved' | 'pending' | 'rejected';
export type CategoryKey = 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess';

export interface Task {
  id?: string;
  category: CategoryKey;
  text: string;
  status: TaskStatus;
  createdBy?: string | 'system';
  createdAt?: any; // Timestamp
  hidden?: boolean;
}

export interface TaskSuggestion {
  id: string;
  text: string;
  categoryId: string;
  authorId: string;
  createdAt: any;
  status: 'pending' | 'approved' | 'rejected';
  author?: { email?: string; uid?: string };
  note?: string;
  hidden?: boolean;
}

export async function listApprovedTasks(category?: CategoryKey): Promise<Task[]> {
  const base = collection(db, col.tasks);
  const q = category
    ? query(base, where('status', '==', 'approved'), where('category', '==', category))
    : query(base, where('status', '==', 'approved'));
  const snap = await getDocs(q);
  
  // Filter hidden tasks client-side until index is ready
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Task) }))
    .filter(task => !task.hidden);
}

export async function createTask(task: Omit<Task, 'id'|'createdAt'>) {
  return addDoc(collection(db, col.tasks), { ...task, createdAt: serverTimestamp() });
}

export async function updateTask(id: string, patch: Partial<Task>) {
  return updateDoc(doc(db, col.tasks, id), patch);
}

export async function deleteTask(id: string) {
  return deleteDoc(doc(db, col.tasks, id));
}

export async function getTask(id: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, col.tasks, id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Task) } : null;
}

// Alias for consistency
export const fetchApprovedTasks = listApprovedTasks;
export const fetchApprovedTasksByCategory = listApprovedTasks;

export async function createTaskApproved(task: Omit<Task, 'id'|'createdAt'|'status'>) {
  return addDoc(collection(db, col.tasks), { 
    ...task, 
    status: 'approved' as TaskStatus, 
    createdAt: serverTimestamp() 
  });
}