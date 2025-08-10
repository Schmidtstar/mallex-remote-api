# MALLEX – Cleanup & Hardening (Agent-Auftrag)

**Ziel:**  
Das vorhandene MALLEX-Projekt bereinigen und für Replit stabilisieren: Ballast entfernen, ENV-Schalter vereinheitlichen (`VITE_HASH_ROUTER`), `.replit` und `vite.config.ts` korrekt setzen, Firebase sicher initialisieren (Analytics optional), Login-Screen schlanker machen. Am Ende muss `npm run dev` ohne Fehler starten und `#/auth` anzeigen.

---

## 0) Arbeitsweise & Reporting
- **Nach jedem Schritt**: kurz berichten, was geändert wurde und ob Fehler auftraten.  
- **Bei Fehlern**: Ursache nennen + Fix vorschlagen/umsetzen.  
- **Nichts entfernen**, was **nicht** in den „Löschen“-Listen steht.  
- **Dateien nur ändern**, wenn unten explizit angewiesen.  
- Am Ende: **Checkliste** (siehe „Definition of Done“) abhaken.

---

## 1) Projekt entrümpeln (nur Ballast löschen)
**Löschen (falls vorhanden):**
```
rm -rf dist
rm -rf .git
rm -rf .config
rm -rf attached_assets
rm -f analysis-report.json
rm -f DELETABLE_FILES_ANALYSIS.md
```
> `scripts/` nur löschen, wenn dort ausschließlich Analyser-/Temp-Skripte liegen. Wenn unsicher: **nicht** löschen, stattdessen kurz auflisten.

---

## 2) ENV-Schalter vereinheitlichen
**Ziel:** Nur noch `VITE_HASH_ROUTER` verwenden.

1) **Globale Suche & Ersetzung**  
- Ersetze überall (Quellcode + README) `VITE_USE_HASH_ROUTER` → `VITE_HASH_ROUTER`.

2) **Router prüfen/anpassen**  
- In `src/router.tsx` muss die Zeile so aussehen:
```ts
const useHash = import.meta.env.VITE_HASH_ROUTER === '1'
```

3) **README/.replit**  
- Stelle sicher, dass überall **nur** `VITE_HASH_ROUTER` dokumentiert/gesetzt ist.

---

## 3) `.replit` minimal & klar
Ersetze den Inhalt von `.replit` durch **genau**:
```toml
language = "nodejs"
onBoot = "install"
run = "npm run dev -- --host --port $PORT"

[env]
VITE_HASH_ROUTER = "1"

[commands]
install = "npm ci || npm i"
dev = "npm run dev -- --host --port $PORT"
build = "npm run build"
preview = "npm run preview -- --host --port $PORT"
```
> Entferne `entrypoint` und alte `workflows`, falls vorhanden, außer du brauchst sie ausdrücklich – dann nur kommentieren.

---

## 4) `package.json` – Scripts & Abhängigkeiten
Sorge für diese Scripts (ersetzen/ergänzen):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host --port 4173"
  }
}
```
- **Falls TypeScript fehlt**: `typescript`, `@vitejs/plugin-react` in `devDependencies` prüfen.  
- **react-router-dom**, **firebase**, **i18next**, **react-i18next** müssen in `dependencies` sein.

---

## 5) `vite.config.ts` – Replit-stabil
Sorge dafür, dass die Config so (oder äquivalent) gesetzt ist:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    hmr: { clientPort: 443 },
    allowedHosts: true
  },
  preview: { host: true, port: 4173 }
})
```

---

## 6) Firebase – ENV-validierung & optional Analytics
**Ziel:** Keine Repo-Keys, kein Crash bei fehlenden ENV, Analytics nur wenn unterstützt.

1) **`src/utils/env.ts` (anlegen/angleichen):**
```ts
export type FirebaseEnv = {
  apiKey?: string; authDomain?: string; projectId?: string;
  appId?: string; messagingSenderId?: string; storageBucket?: string;
  measurementId?: string;
}
export function readFirebaseEnv(): FirebaseEnv {
  const e = import.meta.env
  return {
    apiKey: e.VITE_FIREBASE_API_KEY,
    authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: e.VITE_FIREBASE_PROJECT_ID,
    appId: e.VITE_FIREBASE_APP_ID,
    messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
    measurementId: e.VITE_FIREBASE_MEASUREMENT_ID
  }
}
export function hasAuthEnv(env: FirebaseEnv) {
  return !!(env.apiKey && env.authDomain && env.projectId && env.appId)
}
```

2) **`src/lib/firebase.ts` (verwenden):**
```ts
import { readFirebaseEnv, hasAuthEnv } from '@/utils/env'

export async function getFirebase() {
  const cfg = readFirebaseEnv()
  if (!hasAuthEnv(cfg)) {
    console.warn('[MALLEX] Firebase ENV unvollständig – starte im Gastmodus.')
    return null
  }

  const [{ initializeApp }, { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged }] =
    await Promise.all([import('firebase/app'), import('firebase/auth')])

  const app = initializeApp(cfg as any)
  const auth = getAuth(app)

  let analytics: any
  if (cfg.measurementId) {
    try {
      const { getAnalytics, isSupported } = await import('firebase/analytics')
      if (await isSupported()) analytics = getAnalytics(app)
    } catch {/* optional */}
  }

  return { app, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged, analytics }
}
```

3) **Bucket-Check:** Prüfe `VITE_FIREBASE_STORAGE_BUCKET`.  
- **Muss** die Form `PROJECT_ID.appspot.com` haben (z. B. `mallex-1b745.appspot.com`).  
- **Nicht** `…firebasestorage.app` im ENV speichern.

---

## 7) LoginScreen entschlacken (nur wenn nötig)
- Falls `src/features/Auth/AuthScreen.tsx` sehr groß/kommentarlastig ist:  
  - Keine ToDo-Kommentare, keine „Corrected import“-Zeilen.  
  - Nur die Logik für **Email/Passwort**, **Signup**, **Gast**, **Fehleranzeige**.

---

## 8) HashRouter & Routen-Guard checken
- `src/router.tsx`:
```ts
const useHash = import.meta.env.VITE_HASH_ROUTER === '1'
```
- Guard sollte **nicht** `redirect()` in Render verwenden, sondern:
```tsx
if (!user) return <Navigate to="/auth" replace />
```
- Startet App nach Login/Gast auf `/arena`.

---

## 9) Starten & Testen
Führe aus:
```
npm install
npm run dev
```
**Erwartung:** Replit-Preview (neuer Tab) lädt `#/auth`.  
- **Ohne Secrets:** Hinweis „Firebase ENV nicht gefunden – nutze lokalen Gastmodus.“  
- **Mit Secrets:** Signup/Login funktionieren.

---

## Definition of Done (abzuhaken)
- [ ] Ballastordner gelöscht.  
- [ ] Nur `VITE_HASH_ROUTER` wird verwendet.  
- [ ] `.replit` minimal & korrekt; `package.json` Scripts gesetzt.  
- [ ] `vite.config.ts` mit `allowedHosts:true`, `hmr.clientPort:443`.  
- [ ] Firebase: ENV-Validierung + optional Analytics.  
- [ ] LoginScreen kompakt.  
- [ ] `npm run dev` läuft, App unter `#/auth`, Gast/Email-Login ok.  
- [ ] Keine Console-Errors; HMR funktioniert.

---

## Bonus (optional, falls Zeit)
- `README.md` ergänzen: Secrets setzen, Dev/Prod Kommandos, Hinweis auf Bucket-Format.
