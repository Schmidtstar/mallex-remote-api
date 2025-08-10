# Agent Task: Entferne alle Star-Exports und Default-Imports (Fehlerfix)

## Ziel
Behebe den Build-Fehler:
> "Importing binding name 'default' cannot be resolved by star export entries."

## Schritte

### 1. Projektweite Suche & Ersetzung
- **Suche nach**: `export * from`
  - **Ersetzen** durch **explizite** Re-Exporte, z. B.:
    ```ts
    // vorher
    export * from '../config/menuItems';

    // nachher
    export { menuItems } from '../config/menuItems';
    export type { MenuItem } from '../config/menuItems';
    ```

- **Suche nach**: `import menuItems from` oder generell `import <name> from` für `menuItems.ts`
  - **Ersetzen** durch:
    ```ts
    import { menuItems } from '../config/menuItems';
    ```

- **Suche nach**: `export default`
  - Falls Datei gemeinsam genutzte Werte exportiert → auf **benannte** Exporte umstellen.

---

### 2. Kritische Dateien prüfen
- `src/features/Menu/menuItems.ts` → löschen oder auf benannte Exporte umstellen.
- `src/components/AppDrawer.tsx`
- `src/components/BottomNavigation.tsx`
- `src/features/Menu/MenuScreen.tsx`
- `src/features/Menu/tabs/*.tsx`
- `src/layouts/TabLayout.tsx`
- `src/context/*Context.tsx` (falls Barrel-Files enthalten)
- `src/i18n/index.ts` → keine `export *`

---

### 3. Barrel-Files entfernen
- Alle `index.ts` oder `index.tsx` löschen, die nur `export *` enthalten.
- Direkt aus der Quelldatei importieren.

---

### 4. Dev-Server neu starten
- Nach allen Änderungen Vite neu starten:
  ```bash
  npm run dev
  ```

---

## Endzustand-Beispiel

```ts
// src/config/menuItems.ts
export interface MenuItem { id: string; labelKey: string; icon?: string; }
export const menuItems: MenuItem[] = [ /* … */ ];
```

```ts
// ✅ richtig
export { menuItems } from '../config/menuItems';
export type { MenuItem } from '../config/menuItems';

// Nutzung
import { menuItems } from '@/config/menuItems';
```
