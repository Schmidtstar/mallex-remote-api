
import { db } from '@/lib/firebase';
import { col } from '@/lib/paths';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import type { CategoryKey, Task } from './tasksApi';

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface Suggestion {
  id?: string;
  category: CategoryKey;
  text: string;
  status: SuggestionStatus;
  createdBy: string;  // uid
  createdAt?: any;
  note?: string;
}

export async function createSuggestion(uid: string, category: CategoryKey, text: string) {
  return addDoc(collection(db, col.suggestions), {
    category, text, status: 'pending', createdBy: uid, createdAt: serverTimestamp(),
  });
}

export async function listSuggestionsForUser(uid: string): Promise<Suggestion[]> {
  const q = query(
    collection(db, col.suggestions),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Suggestion) }));
}

export async function listSuggestionsForAdmin(status?: SuggestionStatus): Promise<Suggestion[]> {
  const base = collection(db, col.suggestions);
  const q = status
    ? query(base, where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(base, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Suggestion) }));
}

export async function moderateSuggestion(id: string, action: 'approve' | 'reject', note?: string) {
  if (action === 'approve') {
    await updateDoc(doc(db, col.suggestions, id), { status: 'approved', note: note ?? null });
  } else {
    await updateDoc(doc(db, col.suggestions, id), { status: 'rejected', note: note ?? null });
  }
  return getDoc(doc(db, col.suggestions, id));
}

export async function promoteApprovedSuggestionToTask(suggestion: Suggestion, adminUid?: string) {
  // Call only when suggestion.status === 'approved'
  return addDoc(collection(db, col.tasks), {
    category: suggestion.category,
    text: suggestion.text,
    status: 'approved',
    createdBy: adminUid ?? 'system',
    createdAt: serverTimestamp(),
  });
}
