# MALLEX – Sprint B (Firestore-Helper vereinheitlichen + Tasks/Suggestions harmonisieren)
_Ziel: Einheitliche Firestore-API, stabile Aufgaben-Flows (Übersicht, Vorschlagen, Admin-Moderation). Nur Codeänderungen, keine Shell-Kommandos._

---

## 0) Leitlinien
- **Eine** zentrale Firebase-Quelle: `src/lib/firebase.ts` exportiert `{ app, auth, db }`.
- **Kein** `export *` / keine Barrel-Files für Shared-Module.
- Pfade **genau** wie in den Regeln:  
  - `users/{uid}`  
  - `users/{uid}/players/{playerId}`  
  - `suggestions/{sid}`  
  - `tasks/{tid}`

---

## 1) Firestore-Helper vereinheitlichen

### 1.1 `src/lib/paths.ts` (neu)
```ts
export const col = {
  users: 'users',
  players: (uid: string) => `users/${uid}/players`,
  suggestions: 'suggestions',
  tasks: 'tasks',
  admins: 'admins',
};
```
> Verwende diese Konstanten überall dort, wo Collections gebaut werden.

### 1.2 `src/lib/tasksApi.ts` (neu/ersetzt)
```ts
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
```

### 1.3 `src/lib/suggestionsApi.ts` (neu)
```ts
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
```

---

## 2) UI-Harmonisierung (Ausschnitte)

### 2.1 Aufgaben-Übersicht (read-only approved)
**Datei:** `src/features/Tasks/TasksOverview.tsx` (Bezeichner anpassen)
```tsx
import React, { useEffect, useState } from 'react';
import { listApprovedTasks, type Task, type CategoryKey } from '@/lib/tasksApi';
import { useTranslation } from 'react-i18next';

export default function TasksOverview() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryKey | undefined>(undefined);
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listApprovedTasks(category).then(setItems).finally(() => setLoading(false));
  }, [category]);

  return (
    <div>
      <h2>{t('menu.tasks')}</h2>
      {/* Kategorie-Filter UI hier */}
      {loading ? <div>{t('loading')}</div> : (
        <ul>
          {items.map(it => <li key={it.id}>{it.text}</li>)}
        </ul>
      )}
    </div>
  );
}
```

### 2.2 Vorschlagen (user)
**Datei:** `src/features/Tasks/SuggestTask.tsx`
```tsx
import React, { useState } from 'react';
import { createSuggestion } from '@/lib/suggestionsApi';
import { useAuth } from '@/context/AuthContext'; // angenommen
import type { CategoryKey } from '@/lib/tasksApi';
import { useTranslation } from 'react-i18next';

export default function SuggestTask() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryKey>('fate');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const onSubmit = async () => {
    if (!user?.uid || !text.trim()) return;
    setBusy(true);
    try {
      await createSuggestion(user.uid, category, text.trim());
      setText('');
      setOk(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>{t('menu.suggest')}</h2>
      {/* Kategorie-Auswahl + Textarea */}
      <button disabled={busy || !text.trim()} onClick={onSubmit}>{t('menu.suggest.submit')}</button>
      {ok && <p>{t('menu.suggest.thanks')}</p>}
    </div>
  );
}
```

### 2.3 Admin-Moderation
**Datei:** `src/features/Admin/AdminSuggestions.tsx`
```tsx
import React, { useEffect, useState } from 'react';
import { listSuggestionsForAdmin, moderateSuggestion, promoteApprovedSuggestionToTask, type Suggestion } from '@/lib/suggestionsApi';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AdminSuggestions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listSuggestionsForAdmin('pending'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handle = async (s: Suggestion, action: 'approve' | 'reject') => {
    await moderateSuggestion(s.id!, action);
    if (action === 'approve') {
      await promoteApprovedSuggestionToTask({ ...s, status: 'approved' }, user?.uid);
    }
    await load();
  };

  return (
    <div>
      <h2>{t('menu.admin.pending')}</h2>
      {loading ? <div>{t('loading')}</div> : (
        <ul>
          {items.map(s => (
            <li key={s.id}>
              [{s.category}] {s.text}
              <button onClick={() => handle(s,'approve')}>{t('menu.admin.approve')}</button>
              <button onClick={() => handle(s,'reject')}>{t('menu.admin.reject')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 3) Router-Einbindung (falls noch nicht vorhanden)
- `/tasks/overview` → `TasksOverview`
- `/tasks/suggest` → `SuggestTask`
- `/admin/suggestions` → `AdminSuggestions` (nur sichtbar, wenn `isAdmin===true`)

---

## 4) Akzeptanzkriterien (Abnahme)

- [ ] **Einheitliche Imports:** Überall `import { db } from '@/lib/firebase'` + `col` aus `paths.ts`.  
- [ ] **Tasks Übersicht:** zeigt nur `status=='approved' && hidden!=true`, optional filterbar nach Kategorie.  
- [ ] **Vorschlagen:** legt `suggestions/{sid}` mit `pending` an (user-gebunden).  
- [ ] **Admin:** sieht `pending`, kann `approve/reject`; bei `approve` wird ein Task erzeugt.  
- [ ] **Regeln kompatibel:** Nicht-Admin kann `tasks` nicht schreiben; User sieht nur eigene `suggestions`.  
- [ ] **Keine Barrel-Exports** und keine Duplikat-Initialisierung von Firebase.

---

## 5) Reporting
Bitte nach Umsetzung:
- Geänderte Dateien auflisten.
- Kurz vermerken: Welche Screens/Buttons verhalten sich jetzt wie (1–2 Sätze).
