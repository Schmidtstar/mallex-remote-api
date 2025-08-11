
import { db } from '@/lib/firebase';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy,
} from 'firebase/firestore';

export type Player = { id: string; name: string };

export function playersCol(uid: string) {
  return collection(db, 'users', uid, 'players');
}

export async function addPlayer(uid: string, name: string) {
  return addDoc(playersCol(uid), { name });
}

export async function removePlayer(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, 'players', id));
}

export function listenPlayers(uid: string, cb: (list: Player[]) => void) {
  const q = query(playersCol(uid), orderBy('name'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name })));
  });
}
