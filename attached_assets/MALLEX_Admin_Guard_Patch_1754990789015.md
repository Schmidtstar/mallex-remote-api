# MALLEX – Admin-Guard Patch (Agenten-Anleitung mit Patches)

**Ziel:** Admin-Bereich zuverlässig schützen, Menü-Flags vereinheitlichen, i18n ergänzen.  
**Vorteil:** Minimal-invasive Änderungen, klar testbar, reversibel.

---

## 0) Übersicht der Änderungen
1. **Neuer Guard:** `src/routes/guards/RequireAdmin.tsx` (schützt alle Admin-Routen).
2. **Router umbauen:** Admin-Routen unter den Guard hängen.
3. **Menü-Flags vereinheitlichen:** nur `requiresAuth` und `adminOnly` verwenden.
4. **HamburgerMenu-Filter:** auf `requiresAuth`/`adminOnly` prüfen.
5. **Admin-Screens doppelt absichern:** frühe Rückgabe, falls kein Admin.
6. **i18n ergänzen:** kurze Admin-Texte (DE/EN).

---

## 1) Datei anlegen: RequireAdmin.tsx

**Pfad:** `src/routes/guards/RequireAdmin.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useIsAdmin } from '../../context/AdminContext'

export default function RequireAdmin() {
  const { user, loading } = useAuth()
  const isAdmin = typeof useIsAdmin === 'function' ? useIsAdmin() : false

  if (loading) return null // Optional: Loader einbinden
  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
```

---

## 2) Router anpassen

**Datei:** `src/router.tsx` – Admin-Routen unter den Guard legen.  
> Hinweis: Beispielhafte Struktur – passe ggf. an deine Route-Definition an.

```diff
- import { TabLayout } from './layouts/TabLayout'
+ import { TabLayout } from './layouts/TabLayout'
+ import RequireAdmin from './routes/guards/RequireAdmin'

  // ...

  const router = createHashRouter([
    {
      path: '/',
      element: <TabLayout />,
      children: [
        { path: 'arena', element: <ArenaScreen /> },
        { path: 'legends', element: <LegendsScreen /> },
        { path: 'menu', element: <MenuScreen /> },
-       { path: 'admin/tasks', element: <AdminTasksScreen /> },
-       { path: 'admin/suggestions', element: <AdminSuggestionsScreen /> },
+       {
+         path: 'admin',
+         element: <RequireAdmin />,
+         children: [
+           { path: 'tasks', element: <AdminTasksScreen /> },
+           { path: 'suggestions', element: <AdminSuggestionsScreen /> }
+         ]
+       },
        // ...
      ]
    }
  ])
```

> Falls du `createBrowserRouter` nutzt, identisch anpassen.

---

## 3) Menü-Flags vereinheitlichen

**Datei:** `src/config/menuItems.ts`  
- Nur noch `requiresAuth` und `adminOnly` verwenden.
- Kein `authRequired`/`isAuthenticated` mehr verwenden.

**Patch (Beispiel):**
```diff
- export type MenuItem = {
-   path: string
-   labelKey: string
-   authRequired?: boolean
-   adminOnly?: boolean
-   icon?: React.ReactNode | string
- }
+ export type MenuItem = {
+   path: string
+   labelKey: string
+   requiresAuth?: boolean
+   adminOnly?: boolean
+   icon?: React.ReactNode | string
+ }

- const { isAuthenticated } = useAuth()
+ const { user } = useAuth()
+ const isAuthenticated = !!user

  const items: MenuItem[] = [
-   { path: '/menu', labelKey: 'menu.title', authRequired: true },
-   { path: '/admin/tasks', labelKey: 'admin.tasks', adminOnly: true },
+   { path: '/menu', labelKey: 'menu.title', requiresAuth: true },
+   { path: '/admin/tasks', labelKey: 'admin.tasks', requiresAuth: true, adminOnly: true },
    // ...
  ]
```

---

## 4) HamburgerMenu-Filter korrigieren

**Datei:** `src/components/HamburgerMenu.tsx`

```diff
- if (item.authRequired && !user) return false
+ if (item.requiresAuth && !user) return false

- // admin-Filter
- // (falls vorhanden, ersetzen)
+ // Admin-Filter
  if (item.adminOnly && !isAdmin) return false
```

> Bei der Ausgabe Icons optional schützen: `String(item.icon ?? '')`

---

## 5) Admin-Screens zusätzlich absichern

**Dateien:**  
- `src/features/Admin/AdminSuggestionsScreen.tsx`  
- `src/features/Tasks/AdminTasksScreen.tsx`

Am Anfang der Komponente einfügen:

```tsx
import { useAuth } from '../../context/AuthContext'
import { useIsAdmin } from '../../context/AdminContext'

export default function AdminSuggestionsScreen() {
  const { user } = useAuth()
  const isAdmin = useIsAdmin()

  if (!user || !isAdmin) return null // oder <Navigate to="/" replace />
  // ...
}
```

> Gleiches Muster in `AdminTasksScreen.tsx`.

---

## 6) i18n ergänzen (DE/EN Snippets)

**de.json (Ausschnitt):**
```json
{
  "admin": {
    "title": "Admin",
    "tasks": "Aufgaben",
    "suggestions": "Vorschläge"
  },
  "tasks": {
    "admin": {
      "title": "Aufgabenverwaltung",
      "approve": "Annehmen",
      "reject": "Ablehnen"
    }
  }
}
```

**en.json (Ausschnitt):**
```json
{
  "admin": {
    "title": "Admin",
    "tasks": "Tasks",
    "suggestions": "Suggestions"
  },
  "tasks": {
    "admin": {
      "title": "Task admin",
      "approve": "Approve",
      "reject": "Reject"
    }
  }
}
```

---

## 7) Validierung

```bash
npm run lint
npm run typecheck
npm run build

# Manuell prüfen:
# - Menü zeigt Admin-Einträge nur bei eingeloggtem Admin
# - Direkter Aufruf von /admin/* schützt korrekt (Weiterleitung bei kein Admin)
# - i18n-Texte erscheinen (keine Keys sichtbar)
```

**Definition of Done:**  
- Admin-Routen nur für Admins erreichbar (Guard + Screen-Guards).  
- Menü-Flags konsistent (`requiresAuth`, `adminOnly`).  
- Build fehlerfrei.  
- i18n ergänzt.
