# MALLEX – Phase 4 Fix-Checkliste (Agenten-Anleitung mit Patches)

> Ziel: Alle Build-Blocker beheben (TS-Fehler), ohne Architektur zu ändern. Reihenfolge: **leichte Aufräumarbeiten → Typ-/Prop-Fixes → fehlende Helfer → Router/Firebase**.

---

## 0) TS von `deprecated/` ausschließen (verhindert Fehler aus Altcode)

**Datei:** `tsconfig.json` – *ergänzen/angleichen*

```diff
 {
   "compilerOptions": {
     ...
   },
+  "exclude": ["node_modules", "dist", "build", "src/deprecated/**"]
 }
```

> Falls es bereits ein `exclude` gibt, `src/deprecated/**` hinzufügen.

---

## 1) Menü-Items & HamburgerMenu (icon/authorization)

### 1.1 `src/config/menuItems.ts` – Interface & Auth ableiten

- `MenuItem` um `icon?` und `requiresAuth?` ergänzen.
- Statt `isAuthenticated` aus `useAuth` nutzen wir `user` → `const isAuthenticated = !!user`.

```diff
- import { useTranslation } from 'react-i18next'
- import { useAuth } from '../context/AuthContext'
+ import { useTranslation } from 'react-i18next'
+ import { useAuth } from '../context/AuthContext'
+ import type { ReactNode } from 'react'

 export type MenuItem = {
   path: string
   labelKey: string
+  icon?: ReactNode | string
+  requiresAuth?: boolean
   adminOnly?: boolean
   onClick?: () => void
 }

 export function menuItems(isAdmin: boolean) {
-  const { isAuthenticated } = useAuth()
+  const { user } = useAuth()
+  const isAuthenticated = !!user
   const { t } = useTranslation()
   return [
     // Beispiel:
-    { path: '/arena', labelKey: t('nav.arena') },
+    { path: '/arena', labelKey: t('nav.arena'), icon: '⚔️' },
     // ...
   ]
 }
```

> Falls ihr bereits Icons in der Liste habt, bitte an `icon:` anfügen, sonst bleibt es optional.

### 1.2 `src/components/HamburgerMenu.tsx` – Properties angleichen

- `authRequired` → **`requiresAuth`**
- `item.icon` ist optional → sichere Ausgabe

```diff
- if (item.authRequired && !user) return false
+ if (item.requiresAuth && !user) return false
```

```diff
- <span className={styles.itemIcon}>{item.icon}</span>
+ <span className={styles.itemIcon}>{String(item.icon ?? '')}</span>
```

---

## 2) Kontext & Provider Typ-Fixes

### 2.1 `src/context/AuthContext.tsx` – Fehlerobjekt typisieren

```diff
-        } catch (error) {
-          if (error?.code === 'unavailable') {
+        } catch (error: any) {
+          if ((error as any)?.code === 'unavailable') {
             ...
           }
         }
```

### 2.2 `src/context/PlayersContext.tsx` – `mode` richtig typisieren

```diff
-  const value = useMemo(() => ({
-    players, addPlayer, removePlayer, mode, loading
-  }), [players, addPlayer, removePlayer, mode, loading])
+  const modeResolved: 'firebase' | 'localStorage' = mode === 'firebase' ? 'firebase' : 'localStorage'
+  const value = useMemo(() => ({
+    players, addPlayer, removePlayer, mode: modeResolved, loading
+  }), [players, addPlayer, removePlayer, modeResolved, loading])
```

> Alternativ: Den State `mode` selbst als Union führen. Wichtig ist, dass **der Provider `mode` als Union liefert**.

### 2.3 Unused Imports entfernen (Warnungen/Fehler)

- `src/context/AdminContext.tsx`: `doc`, `getDoc`, ggf. `React` aus Import entfernen, falls nicht genutzt.
- Gleiches für: `AdminSuggestionsScreen.tsx`, `ArenaScreen.tsx`, `MenuScreen.tsx`, `TasksOverviewScreen.tsx`, `TabLayout.tsx`, `main.tsx`.

Beispiel:
```diff
- import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
+ import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
```

---

## 3) MenuScreen – Feldnamen, Helfer & Optionen

**Problemstellen:** `birthDate` vs. `birthdate`, fehlende Helfer (`formatISOToDob`, `parseDobInputToISO`, `calcAgeFromISO`), fehlende `genderOptions`/`nationalityOptions` und Konflikt durch lokales `UserProfile`.

### 3.1 Import-Bereinigung und Helfer ergänzen
**Datei:** `src/features/Menu/MenuScreen.tsx`

- Keine lokale `UserProfile`-Definition anlegen (Konflikt)!
- Helper lokal hinzufügen (falls nicht aus utils importiert).

```diff
- import React, { useState, useEffect } from 'react';
- import { getUserProfile, updateUserProfile, nationalities, UserProfile } from '../../lib/userApi';
- import { calculateAge, isValidDate } from '../../utils/dateUtils';
+ import { useEffect, useState } from 'react';
+ import { getUserProfile, updateUserProfile, nationalities, UserProfile } from '../../lib/userApi';

+ // Hilfsfunktionen (falls in utils/dateUtils.ts nicht vorhanden/anders benannt)
+ function formatISOToDob(iso?: string) {
+   if (!iso) return ''
+   const d = new Date(iso)
+   if (isNaN(d.getTime())) return ''
+   const pad = (n: number) => String(n).padStart(2, '0')
+   return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`
+ }
+ function parseDobInputToISO(input?: string) {
+   if (!input) return undefined
+   const m = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
+   if (!m) return undefined
+   const [_, dd, mm, yyyy] = m
+   const iso = `${yyyy}-${mm}-${dd}T00:00:00.000Z`
+   return iso
+ }
+ function calcAgeFromISO(iso?: string) {
+   if (!iso) return 0
+   const d = new Date(iso); if (isNaN(d.getTime())) return 0
+   const now = new Date()
+   let age = now.getFullYear() - d.getFullYear()
+   const m = now.getMonth() - d.getMonth()
+   if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
+   return age
+ }
```

### 3.2 Feldnamen vereinheitlichen (`birthdate`)

```diff
-         birthDate: profile?.birthDate || null,
+         birthdate: profile?.birthdate,
```

```diff
-         birthDate: profile?.birthDate ? formatISOToDob(profile.birthDate) : '',
+         birthdate: profile?.birthdate ? formatISOToDob(profile.birthdate) : '',
```

```diff
-       const birthDateISO = parseDobInputToISO(editForm.birthDate);
-       ...
-         birthDate: birthDateISO,
+       const birthdateISO = parseDobInputToISO(editForm.birthdate);
+       ...
+         birthdate: birthdateISO,
```

### 3.3 Options & Types anpassen

```diff
- const genderOptions = ...
- const nationalityOptions = ...
+ const genderOptions: Array<'male'|'female'|'diverse'> = ['male','female','diverse']
+ const nationalityOptions = nationalities
```

### 3.4 `Partial<UserProfile>` korrekt befüllen (keine `null`)

```diff
-        displayName: editForm.displayName || null,
+        displayName: editForm.displayName || undefined,
@@
-        gender: editForm.gender || null,
+        gender: editForm.gender || undefined,
@@
-        nationality: editForm.nationality || null
+        nationality: editForm.nationality || undefined
```

### 3.5 Anzeigenutzung korrigieren

```diff
- {formatISOToDob(userProfile.birthDate)}
+ {formatISOToDob(userProfile.birthdate)}
@@
- {calcAgeFromISO(userProfile.birthDate)}
+ {calcAgeFromISO(userProfile.birthdate)}
```

---

## 4) Router & Firebase

### 4.1 `src/main.tsx` – `future`-Prop entfernen & Unused Imports

```diff
- import React from 'react'
- import { ErrorBoundary } from './components/ErrorBoundary'
  ...
-   <RouterProvider router={router} future={{ v7_startTransition: true }} />
+   <RouterProvider router={router} />
```

### 4.2 `src/router.tsx` – veraltete `future`-Flags entfernen und Element-Einsatz

- Überall `v7_startTransition: true` entfernen.
- Sicherstellen, dass `TabLayout` **als Element** verwendet wird (z. B. `element: <TabLayout />`) und **nicht** als Wrapper mit Children, außer `TabLayout` nimmt `children` an. Falls vorhanden, lieber `<Outlet />` im `TabLayout` nutzen.

```diff
-         future: { v7_startTransition: true },
+         // removed legacy future flags
```

### 4.3 `src/lib/firebase.ts` – ungültige FirestoreSettings-Option

```diff
- const settings: FirestoreSettings = {
-   useFetchStreams: false,
- }
+ const settings: FirestoreSettings = {}
```

---

## 5) Admin/Tasks – kleinere Typ-Anpassungen

- `AdminTasksScreen.tsx` → `edit`-Signatur prüfen (scheint `string` zu erwarten, nicht `{ text }`):
```diff
- edit(id, { text: editText })
+ edit(id, editText)
```

- `AdminSuggestionsScreen.tsx` → Unused `React` entfernen, `TaskSuggestion` hat kein `author`? Dann optional machen oder Anzeige entfernen:
```diff
- {item.author && ( ... )}
+ {/* Author optional/nicht vorhanden – Anzeige vorerst entfernt/optional machen */}
```

---

## 6) Aufräumen – Imports & Lints

Einmal global Unused Imports entfernen:
```bash
npx eslint --fix src || true
```

---

## 7) Validierung (in dieser Reihenfolge ausführen)

```bash
npm run lint
npm run typecheck
npm run build
```

- Wenn Fehler verbleiben → zuerst die betroffene Datei aus den obigen Abschnitten prüfen.

---

## 8) Optional – HMR-Stabilität (TaskSuggestionsContext)

Falls HMR mit dem Context zickt: Achte auf **stabile Exports** (keine bedingten Exports), und reduziere dynamische Top-Level-Seiteneffekte.

---

**Definition of Done (Phase 4 – Fixes):**
- Build fehlerfrei (0 TS-Errors)
- Lint/Typecheck clean
- Menü/Profil-Screens ohne Laufzeitfehler (birthdate, Optionen, Formatter)
- Router & Firebase ohne veraltete Flags/Settings
