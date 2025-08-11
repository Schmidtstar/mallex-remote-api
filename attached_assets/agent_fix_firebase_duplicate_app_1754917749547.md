# Delta-ID: fix-firebase-duplicate-app

## Ziel
Behebe den Fehler **"Firebase App named '[DEFAULT]' already exists with different options or config (app/duplicate-app)"** durch eine _einzige_ zentrale Firebase-Initialisierung und konsistente Importe in der gesamten Codebase.

---

## Aufgabenübersicht (Agent TODO)
1. **Zentrale Initialisierung anlegen/vereinheitlichen**
   - Datei: `src/lib/firebase.ts`
   - Initialisiere die App nur einmal über `getApps().length ? getApp() : initializeApp(...)`.
   - Exponiere genau **diese** Instanzen:
     - `export const auth = getAuth(app);`
     - `export const db = getFirestore(app);`
     - `export default app;`

2. **Doppelte Initialisierungen entfernen**
   - Finde und entferne **alle** weiteren `initializeApp(...)`-Aufrufe in der Codebase.
   - Entferne/vereinheitliche alternative Firebase-Dateien wie `firebase.client.ts`, `firebaseConfig.ts`, `firebaseApp.ts` o. ä. (falls vorhanden).

3. **Inkonsistente/duplizierende Exporte vermeiden**
   - Keine Barrel-Exports aus `lib/` (z. B. `export * from './lib/firebase'`) verwenden.
   - `auth`/`db` **nur** aus `@/lib/firebase` importieren, **nirgends** erneut exportieren.

4. **Alle Imports vereinheitlichen**
   - Überall `import { auth, db } from '@/lib/firebase'` (bzw. Pfad-Alias des Projekts).
   - Sicherstellen, dass es **keine** gemischten Pfade wie `@/lib/firebase` und `../lib/firebase` gibt.

5. **Pfad-Alias absichern**
   - In `tsconfig.json` prüfen/setzen:
     ```json
     {
       "compilerOptions": {
         "baseUrl": "src",
         "paths": {
           "@/*": ["*"]
         }
       }
     }
     ```

6. **Aufräumen & Neustart**
   - Veraltete/zweite Firebase-Dateien löschen.
   - Dev-Server komplett neu starten (Stop → Start), um Caches zu räumen.

---

## Referenzimplementierung: `src/lib/firebase.ts`
```ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Einmalige Initialisierung (HMR-sicher)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

> **Wichtig:** Keine alternativen Exporte wie `export { auth as authInstance }` oder zusätzliche `export default`-Varianten erzeugen.

---

## Suche/Ersetze-Check (Agent ausführen)
- Suche nach mehrfacher Initialisierung:
  - `initializeApp(`
- Suche nach Barrel-Exports:
  - `export * from './lib/firebase'`
- Suche nach doppelten/alias Exports von `auth`, `db`, `app`.
- Suche nach gemischten Importpfaden:
  - `from '../lib/firebase'` **ersetzen** durch `from '@/lib/firebase'`.

---

## Abnahmekriterien
- [ ] Es existiert **genau eine** Datei, die `initializeApp` aufruft: `src/lib/firebase.ts`.
- [ ] In der gesamten Codebase werden `auth` und `db` **nur** aus `@/lib/firebase` importiert.
- [ ] Keine Barrel-Exports/Star-Exports involviert, die `auth/db/app` erneut exportieren.
- [ ] Dev-Server startet ohne Fehler/Overlay.
- [ ] Die Konsole zeigt **keine** Meldung `app/duplicate-app` mehr.
- [ ] Auth- und Firestore-Aufrufe funktionieren weiterhin (Login, Logout, Reads/Writes).

---

## Hinweise für Monorepo/SSR (falls relevant)
- Falls ein SSR-Framework verwendet wird (Next/Vite SSR), **nur clientseitig** initialisieren.
- Keine Initialisierung in Dateien, die sowohl Server als auch Client importieren könnten.

---

## Kurzdiagnose bei Rückfall
1. Prüfe, ob ein neuer Import mit relativem Pfad (`../lib/firebase`) reingerutscht ist.
2. Prüfe, ob eine weitere Datei `initializeApp` importiert/ausführt.
3. Prüfe, ob ein Barrel-Export `export *` `auth/db` indirekt doppelt re-exportiert.