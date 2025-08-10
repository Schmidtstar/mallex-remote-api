# Delta-ID: purge-last-star-export-and-default-import (Follow‑up)

**Goal**
The Vite build error `Importing binding name 'default' cannot be resolved by star export entries.` still appears. We must **remove any remaining `export *` barrels and default imports** across the codebase, ensure **all internal modules use named exports only**, and **point all imports to the new central config** (`src/config/menuItems.ts`). Also **clear Vite caches**. This is a continuation after the first purge pass.

---

## 0) Safety & context
- Project is a Vite + React + TS app.
- We already created `src/config/menuItems.ts` and migrated many imports.
- Old barrels like `src/features/Menu/menuItems.ts` were removed, but the error persists → there is still at least **one** of:
  - a `export * from '...'` somewhere (maybe nested).
  - an **inadvertent default import** from a file that only has named exports.
  - a package-local barrel that re-exports default under the hood.

**Acceptance criteria**
1. No source file uses `export * from ...` or an `index.ts` barrel (except i18n).
2. No internal import uses `import X from '...'` for project files. Use `import { X } from '...'` instead.
3. All menu related imports sourced from `src/config/menuItems.ts`.
4. Vite dev server starts cleanly. No console error: _“Importing binding name 'default' cannot be resolved by star export entries.”_
5. TypeScript builds with `tsc --noEmit` zero errors.

---

## 1) Hard-clean caches
Run these exactly in the repo root:
```bash
rm -rf node_modules/.vite .vite dist
npm i
```
> If using Replit, stop the server first, then run the commands above, then restart `npm run dev`.

---

## 2) Repository sweep — find offenders

**Star exports / barrels**
```bash
# Any star re-export (avoid i18n dir)
grep -Rn "export \* from" src | grep -v "src/i18n"
# Any barrel index (avoid i18n)
find src -name "index.ts" -o -name "index.tsx" | grep -v "src/i18n"
```

**Default imports from local files**
```bash
# default imports that look like local (starting with ./ or ../ or @/)
grep -Rn "import\s\w\+\sfrom\s['\"]\(\./\|../\|@/\)" src
```

**Suspicious re-exports that could create default via star**
```bash
grep -Rn "export\s{\s*default" src || true
```

For **every match** perform the fixes below.

---

## 3) Canonicalize exports (named only)

General rules you must enforce project-wide:

- **No default exports** in our own files. Replace with named.
- **No `export * from`**. Replace with explicit named list.
- **No `index.ts` / `index.tsx` barrels** (except in `src/i18n`). Inline import from the concrete file.
- All menu imports **must** come from `src/config/menuItems.ts`.

### Common refactor patterns

**a) Replace default export in a module**
```ts
// Before
export default function AppDrawer() {...}
// After
export function AppDrawer() {...}
```

**b) Replace default import usages**
```ts
// Before
import AppDrawer from "@/components/AppDrawer";
// After
import { AppDrawer } from "@/components/AppDrawer";
```

**c) Replace star re-export**
```ts
// Before (barrel)
export * from "../components/Foo";
export * from "../components/Bar";
// After
export { Foo } from "../components/Foo";
export { Bar } from "../components/Bar";
```

---

## 4) Files to audit & fix explicitly

Check and, if needed, update these (paths based on current repo layout). **Do not skip.**

### Components
- `src/components/AppDrawer.tsx`  
  - Ensure: `export function AppDrawer(...) {}` (named).
  - Ensure callers use `import { AppDrawer } from '@/components/AppDrawer'`.
- `src/components/BottomNavigation.tsx`  
  - Must import menu items via:  
    `import { menuItems } from '@/config/menuItems'`
- `src/components/ErrorBoundary.tsx`  
  - Export named: `export class ErrorBoundary ...` or `export function ErrorBoundary ...`.
  - Update all imports to named form.

### Menu
- `src/config/menuItems.ts`  
  - Only **named** exports:
    ```ts
    export interface MenuItem { ... }
    export const menuItems: MenuItem[] = [...];
    ```
- `src/features/Menu/menuItems.ts`  
  - **Must not exist.** If present, delete it. All imports must point to `src/config/menuItems.ts`.
- `src/features/Menu/components/*` and `src/features/Menu/tabs/*`  
  - Replace any default imports with named.
  - Replace any `export *` or `index.ts` barrels.

### Context
- `src/context/*Context.tsx`  
  - Ensure **named** exports for providers and hooks:  
    `export function AuthProvider(...)`, `export function useAuth(){...}`, etc.
  - Update all imports accordingly.

### Arena & Legends
- `src/features/Arena/*.ts*`, `src/features/Legends/*.ts*`  
  - Same checks: no default imports; no barrels.

### i18n (exception)
- `src/i18n/index.ts` may re-export json/types as needed. Avoid `export *` from TS sources. JSON is fine.

---

## 5) Replace residual imports — code mods (guided)

Perform search/replace, then verify by hand:

- Replace:
  - `from "@/features/Menu/menuItems"` → `from "@/config/menuItems"`
  - `import X from "..."` (project-local) → `import { X } from "..."`
- Remove any remaining `index.ts` consumption such as `from "@/components"`; point to file:  
  `from "@/components/AppDrawer"`

---

## 6) Rebuild & verify

1. Stop dev server.
2. Clean again (just in case):
   ```bash
   rm -rf node_modules/.vite .vite dist
   ```
3. Start: `npm run dev`
4. Confirm **no** console error:  
   > Importing binding name 'default' cannot be resolved by star export entries.
5. Run TS check:
   ```bash
   npx tsc --noEmit
   ```

---

## 7) Deliverable summary

- ✅ No `export *` left (except JSON/i18n allowances).
- ✅ No default exports/imports for local modules.
- ✅ All menu imports from `src/config/menuItems.ts`.
- ✅ Vite dev server runs without the star-export/default error.
- ✅ TS passes with `--noEmit`.

If the error persists after these steps, print the **full stack** from the Vite overlay and list **exact file and line** that triggers it, then continue the sweep on that exact import chain.
