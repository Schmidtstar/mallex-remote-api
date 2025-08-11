import { db } from '@/lib/firebase';
import { col } from '@/lib/paths';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where,
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

export async function listApprovedTasks(category?: CategoryKey): Promise<Task[]> {
  const base = collection(db, col.tasks);
  const q = category
    ? query(base, where('status', '==', 'approved'), where('hidden', '!=', true), where('category', '==', category), orderBy('category'))
    : query(base, where('status', '==', 'approved'), where('hidden', '!=', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Task) }));
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