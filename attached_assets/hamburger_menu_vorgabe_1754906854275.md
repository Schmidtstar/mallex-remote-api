# Vorgabe: Hamburger-Menü beschriften & Logout ins Profil verlagern

## Ziel
- Hamburger-Menü soll **genau 4 Einträge** (in dieser Reihenfolge) anzeigen:
  1. **Arena**
  2. **Halle der Legenden**
  3. **Profil**
  4. **Einstellungen**
- **Kein Logout im Hamburger-Menü**. Logout befindet sich **nur in der Profil-Ansicht**.

---

## Änderungen (konkret & minimal-invasiv)

### 1) `src/config/menuItems.ts`
- Menügruppen so definieren, dass **nur** die vier Einträge oben vorhanden sind.
- Beispiel (anpassen an bestehende Typen, Icons optional):

```ts
// src/config/menuItems.ts
export type MenuItem = {
  key: 'arena' | 'legends' | 'profile' | 'settings';
  labelKey: string;           // i18n key
  path: '/arena' | '/legends' | '/menu?tab=profile' | '/menu?tab=settings';
  icon?: string;              // optional, falls genutzt
};

export const menuGroups = [
  {
    id: 'main',
    items: [
      { key: 'arena',   labelKey: 'menu.arena',   path: '/arena',   icon: '🏟️' },
      { key: 'legends', labelKey: 'menu.legends', path: '/legends', icon: '🏛️' },
      { key: 'profile', labelKey: 'menu.profile', path: '/menu?tab=profile', icon: '👤' },
      { key: 'settings',labelKey: 'menu.settings',path: '/menu?tab=settings', icon: '⚙️' },
    ] as MenuItem[],
  },
];
```

> WICHTIG: **Keine** Logout-Items hier definieren.  
> Falls es weitere Gruppen gab (Admin, Diverses), **deaktivieren/entfernen** – außer sie werden anderswo explizit gebraucht.

---

### 2) i18n: `src/i18n/de.json` & `src/i18n/en.json`
- Sicherstellen, dass die **Labels einfache Strings** sind (kein Objekt!).
- Ergänzen/angleichen:

```json
// de.json
{
  "menu": {
    "title": "Menü",
    "arena": "Arena",
    "legends": "Halle der Legenden",
    "profile": "Profil",
    "settings": "Einstellungen",
    "logout": "Abmelden"
  }
}
```

```json
// en.json
{
  "menu": {
    "title": "Menu",
    "arena": "Arena",
    "legends": "Hall of Legends",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Log out"
  }
}
```

> Hinweis: „object instead of string“-Fehler vermeiden: Jeder Key muss **String** sein.

---

### 3) `src/components/HamburgerMenu.tsx`
- Rendering ausschließlich aus `menuGroups` speisen.
- **Logout-Eintrag entfernen** (falls vorhanden).
- Beim Klick: `navigate(item.path)` (React Router).  
- Reihenfolge entspricht `menuGroups[0].items`.

Pseudocode:

```tsx
// innerhalb HamburgerMenu.tsx (Render)
{menuGroups[0].items.map(item => (
  <button
    key={item.key}
    onClick={() => { navigate(item.path); onClose(); }}
    className="menuItem"
    aria-label={t(item.labelKey)}
  >
    <span className="icon">{item.icon}</span>
    <span className="label">{t(item.labelKey)}</span>
  </button>
))}
```

---

### 4) Profil-Ansicht: Logout dorthin verlagern
- In **Profile-Tab** (z. B. `src/features/Menu/tabs/ProfileTab.tsx`) Logout-Button integrieren:
  - **Nur anzeigen, wenn eingeloggt**.
  - Handler aus `AuthContext` nutzen.

Beispiel:

```tsx
import { useAuth } from '@/context/AuthContext';

export default function ProfileTab() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="card">
      <h2>{t('menu.profile')}</h2>

      {user ? (
        <>
          <div className="row">{user.email}</div>
          <button
            onClick={logout}
            disabled={loading}
            className="btn btn-danger"
            aria-label={t('menu.logout')}
          >
            {t('menu.logout')}
          </button>
        </>
      ) : (
        <div className="row">{/* Link/CTA zum Login/SignUp */}</div>
      )}
    </div>
  );
}
```

> Falls es bisher einen Logout-Button im Drawer gab: **entfernen**.

---

## Aufräumen
- Alle alten Logout-Menüpunkte im Drawer entfernen.
- Keine toten Imports (z. B. `menu.logout`) mehr im Drawer.
- Sicherstellen, dass keine **Barrel-Re-exports** (`export *`) mehr Probleme verursachen.

---

## Akzeptanzkriterien (bitte testen)
1. Hamburger-Menü zeigt **genau** 4 Einträge (Arena → Halle der Legenden → Profil → Einstellungen) in **dieser Reihenfolge**.
2. Klick navigiert korrekt zu:
   - Arena → `/arena`
   - Halle der Legenden → `/legends`
   - Profil → `/menu?tab=profile`
   - Einstellungen → `/menu?tab=settings`
3. **Kein Logout im Hamburger-Menü** sichtbar.
4. **Logout im Profil** sichtbar und funktional (nur wenn eingeloggt).
5. **Keine** i18n-Fehler („returned an object instead of string“), **keine** Console-Errors.
6. Labels wechseln korrekt bei Sprachumschaltung (de/en).

---

## Hinweise
- Falls MenuScreen Tabs via Query-Param (`?tab=…`) steuert, sicherstellen, dass `profile` und `settings` als gültige Tab-Keys vorhanden sind.
- Staging-Check: Mobile Hit-Areas ≥44px beibehalten; Drawer schließt bei Navigation & ESC; Fokusmanagement ok.

---

Wenn alles so umgesetzt ist, entspricht das exakt der gewünschten UX: **Menüeinträge sauber benannt & geordnet**, **Logout ausschließlich im Profil**.
