
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function isEmailAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const ref = doc(db, 'admins', email);
  const snap = await getDoc(ref);
  return snap.exists();
}
