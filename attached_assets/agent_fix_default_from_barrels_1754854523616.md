# Delta-ID: purge-last-star-export-and-default-import

## Ziel
Den verbleibenden Build-Fehler _“Importing binding name 'default' cannot be resolved by star export entries.”_ eliminieren, indem **alle Star-Re-Exports** entfernt werden und **alle Importe explizite, benannte Importe** sind (keine Default-Imports auf Barrels).

## Schritt 0 – Suche & Inventur (Repo-weit unter `/src`)
1) **Suchen nach Re-Exports / Barrels**
- `export * from `
- `export { default as `
- Dateien `index.ts` / `index.tsx` mit Re-Exports

2) **Suchen nach verdächtigen Default-Imports auf Verzeichnisse/Barrels**
- `import .* from '@/'`
- `import .* from 'src'`
- `import .* from '..'` (ohne Dateiendung)
- speziell auf Pfade, die auf Ordner zeigen (z. B. `@/features/Menu/tabs`, `@/components`, `@/features/Menu`, `@/context`)

> Notiere jede Fundstelle.

## Schritt 1 – Re-Exports entfernen/umschreiben
Für **jede** Datei, die aktuell Re-Exports macht (z. B. `export * from './SuggestTab'`):
- **Bevorzugt:** Barrel **löschen** und alle Konsumenten auf **direkte Datei-Imports** umstellen.  
  Beispiel: statt `@/features/Menu/tabs` → `@/features/Menu/tabs/SuggestTab`
- Falls ein Barrel unbedingt bleiben muss: **keine Star-Exports**. **Explizit** und **nur benannte** weiterleiten:
  ```ts
  // index.ts (Beispiel)
  export { SuggestTab } from './SuggestTab';
  export { TasksTab } from './TasksTab';
  export { ProfileTab } from './ProfileTab';
  export type { SuggestTabProps } from './SuggestTab';
  ```
  **Kein** `default` weiterreichen und **kein** `export *`.

## Schritt 2 – Alle Importe vereinheitlichen
- **Keine** Default-Imports aus Barrels/Ordnern.  
  Ersetze z. B.:
  ```ts
  import Something from '@/features/Menu/tabs';      // ❌
  import Something from '@/features/Menu';           // ❌
  import * as Tabs from '@/features/Menu/tabs';      // ❌
  ```
  **durch direkte, benannte Importe:**
  ```ts
  import { SuggestTab } from '@/features/Menu/tabs/SuggestTab';  // ✅
  import { TasksTab }   from '@/features/Menu/tabs/TasksTab';    // ✅
  import { ProfileTab } from '@/features/Menu/tabs/ProfileTab';  // ✅
  ```
- Prüfe/aktualisiere besonders folgende Ordner (typische Barrel-Kandidaten):
  - `src/features/Menu/tabs/` (ganz wichtig)
  - `src/features/Menu/` (evtl. `index.ts`)
  - `src/components/` (evtl. `index.ts`)
  - `src/context/` (evtl. `index.ts`)
- Falls irgendwo noch `export default` verwendet wird: **nur** dort erlaubt, wo die Datei **direkt** importiert wird (mit vollständigem Pfad). **Keine** Default-Imitate über Barrels.

## Schritt 3 – Sicherstellen, dass `menuItems` weiterhin benannt exportiert wird
- `src/config/menuItems.ts`:
  ```ts
  export interface MenuItem { id: string; labelKey: string; route?: string; icon?: string; adminOnly?: boolean; }
  export const menuItems: MenuItem[] = [/* … */];
  ```
- Überall, wo benötigt:
  ```ts
  import { menuItems } from '@/config/menuItems';
  ```
- **Keine** Re-Exports (`export *`) dieser Datei anderswo.

## Schritt 4 – Quick-Fix für Tabs (falls vorhanden)
- Falls `src/features/Menu/tabs/index.ts` existiert und mit Re-Exports arbeitet:
  - Entweder **löschen** und alle Imports anpassen (siehe Schritt 2),
  - oder so umbauen:
    ```ts
    export { SuggestTab } from './SuggestTab';
    export { TasksTab }   from './TasksTab';
    export { ProfileTab } from './ProfileTab';
    export { AdminTab }   from './AdminTab';
    export { SettingsTab } from './SettingsTab';
    ```
    und **alle** Konsumenten wechseln auf **benannte** Imports:
    ```ts
    import { SuggestTab, TasksTab } from '@/features/Menu/tabs';
    ```
    (Wichtig: **keine** Default-Imports).

## Akzeptanzkriterien
- [ ] **Kein** Vite-Overlay mehr mit _“default cannot be resolved by star export entries”_.
- [ ] Im gesamten `/src` gibt es **keinen** `export * from` mehr.
- [ ] **Keine** Default-Imports aus Ordnern/Barrels; nur direkte Dateiimporte oder benannte Imports aus expliziten Barrels.
- [ ] Menü/Drawer/Tabs funktionieren unverändert.

## Hinweise
- **Keine funktionalen Änderungen** an UI/Logik. Nur Modulsystem/Imports aufräumen.
- Nach Abschluss **Dev-Server neu starten** (HMR cacht manchmal Barrels).
