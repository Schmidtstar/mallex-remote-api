# MALLEX – Nächste Schritte (auth → Profil, „Halle der Legenden“ persistent, Regeln)

> Ziel: **Automatische Profilerstellung bei Login/Signup**, **persistente Spieler pro Nutzer** (`users/{uid}/players`), **klare Firestore‑Regeln**, und **bereinigte Context/API‑Schicht**. Diese Vorgabe ist so geschrieben, dass ein Agent sie Schritt für Schritt ausführen kann.

---

## 0) Kurzüberblick (was am Ende funktionieren muss)

- Beim **ersten Login/Signup** wird automatisch ein Dokument `users/{uid}` erstellt/aktualisiert (E‑Mail, DisplayName, optionale Profildaten).
- In der **Halle der Legenden** können Spieler **hinzugefügt/gelöscht** werden; die Liste lädt **live** aus `users/{uid}/players` und ist beim nächsten Start wieder da.
- **Admins** bleiben wie bisher über `admins/{email}` erkennbar (wurde schon eingerichtet).
- Firestore‑**Regeln** erlauben: Nutzer → nur eigene Profile & eigene `players`, Admin → Vorschläge/Tasks verwalten.
- Keine „getFirebase()“-Reste, alle Zugriffe nutzen **ein zentrales `db`** aus `src/lib/firebase.ts`.

---

## 1) Firestore‑Regeln **ergänzen** (Users + Players)

> In der Firebase‑Konsole → Firestore → **Regeln**

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function signedIn() { return request.auth != null; }
    function owner(uid) { return signedIn() && request.auth.uid == uid; }
    function admin() {
      return signedIn()
        && request.auth.token.email != null
        && exists(/databases/$(db)/documents/admins/$(request.auth.token.email));
    }

    /* Admin-Whitelist */
    match /admins/{email} {
      allow read: if admin();
      allow write: if false;
    }

    /* User-Profil */
    match /users/{uid} {
      allow read, create, update: if owner(uid);

      /* Subcollection: players  -> users/{uid}/players/{pid} */
      match /players/{pid} {
        allow read, create, update, delete: if owner(uid);
      }
    }

    /* Vorschläge (User) */
    match /suggestions/{sid} {
      allow create: if signedIn()
        && request.resource.data.category in ['fate','shame','seduce','escalate','confess']
        && request.resource.data.text is string
        && request.resource.data.text.size() > 0
        && request.resource.data.createdBy == request.auth.uid;

      allow read: if admin() || (signedIn() && resource.data.createdBy == request.auth.uid);
      allow update, delete: if admin();
    }

    /* Globale Aufgaben (Admin) */
    match /tasks/{tid} {
      allow read: if signedIn();
      allow create, update, delete: if admin()
        && request.resource.data.category in ['fate','shame','seduce','escalate','confess']
        && request.resource.data.text is string
        && request.resource.data.text.size() > 0;
    }

    match /{document=**} { allow read, write: if false; }
  }
}
```

**Wichtig:** Nach dem Speichern „**Regeln veröffentlichen**“ klicken.

---

## 2) Firebase‑Bootstrap vereinheitlichen

**Datei:** `src/lib/firebase.ts`  
**Soll‑Exports:** `app`, `auth`, `db`

- Initialisierung HMR‑sicher: `getApps().length ? getApp() : initializeApp(...)`
- Nur **ein** Export von `auth`, **ein** Export von `db` (kein `getFirebase()` mehr im Projekt).

> Falls vorhanden: alle Importe wie `getFirebase()` ersetzen durch `import { db } from '@/lib/firebase'` (Pfad ggf. anpassen).

---

## 3) API: User‑Profil beim Login/Signup **sicherstellen**

**Datei (neu/erweitern):** `src/lib/userApi.ts`

```ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function ensureUserProfile(uid: string, data: {
  email?: string;
  displayName?: string;
}) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
  }
  return ref;
}
```

---

## 4) Auth‑Context: Profil anlegen + UID bereitstellen

**Datei:** `src/context/AuthContext.tsx`

- Nach erfolgreichem Login/Signup die `ensureUserProfile()` aufrufen.
- `user` (inkl. `uid`, `email`, `displayName`) im Context bereitstellen.

Beispiel‑Patch (Ausschnitt):

```ts
import { ensureUserProfile } from '@/lib/userApi';

// nach onAuthStateChanged(user):
if (user) {
  await ensureUserProfile(user.uid, {
    email: user.email ?? undefined,
    displayName: user.displayName ?? undefined,
  });
}
```

---

## 5) Players‑API (CRUD auf users/{uid}/players)

**Datei (neu):** `src/lib/playersApi.ts`

```ts
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
```

---

## 6) PlayersContext **vereinheitlichen** (optional, aber empfohlen)

**Datei:** `src/context/PlayersContext.tsx`

- Den bisherigen lokalen Zustand durch die Listener aus `playersApi` ersetzen.
- Beim Mounten (und vorhandener `uid`) `listenPlayers(uid, setState)` abonnieren.
- `add(name)`, `remove(id)` über `playersApi` implementieren.

---

## 7) „Halle der Legenden“ Screen anpassen

**Datei:** `src/features/Legends/LegendsScreen.tsx` (oder die Datei, in der der Screen derzeit liegt)

- Statt localStorage die Daten aus `PlayersContext` (oder direkt via `playersApi`) verwenden.
- Beim Hinzufügen: `addPlayer(uid, name)`; beim Löschen: `removePlayer(uid, id)`.
- Wenn **nicht eingeloggt** → Hinweis anzeigen (oder Gast‑Fallback belassen, je nach UX‑Entscheid).

---

## 8) i18n (falls nötig)

Falls im UI Keys wie `menu.profile` o. Ä. angezeigt werden, die **Objekte statt Strings** liefern, die entsprechenden Einträge in `src/i18n/de.json` und `src/i18n/en.json` prüfen und **als String** hinterlegen.

---

## 9) Checkliste – Abnahme

- [ ] Regeln deployed; `users/{uid}/players` erlaubt owner‑Zugriff
- [ ] `src/lib/firebase.ts` exportiert **nur** `app`, `auth`, `db` (keine Duplikate)
- [ ] **Keine** `getFirebase()`‑Verwendungen mehr im Code
- [ ] `ensureUserProfile()` wird beim Auth‑Wechsel aufgerufen
- [ ] „Halle der Legenden“ lädt/speichert Spieler pro Nutzer
- [ ] Logout leitet zuverlässig auf Auth‑Screen weiter
- [ ] Admin bleibt über `admins/{email}` erkennbar

---

## 10) Troubleshooting

- **permission‑denied** bei Spieler‑Liste → Regeln nicht deployed / UID fehlt / nicht eingeloggt
- **invalid‑argument** → Prüfen, dass `uid` nicht leer ist, bevor Collection‑Pfad gebaut wird
- **Duplicate Firebase app** → In `firebase.ts` HMR‑sichere Initialisierung verwenden und nur **ein** mal importieren

---

## 11) Optional: Migration LocalStorage → Firestore

Wenn lokal bereits Spieler gespeichert wurden, beim ersten Start nach Login **einmalig** lesen, in Firestore schreiben und lokal löschen, damit die alte Liste nicht mehr verwendet wird.
