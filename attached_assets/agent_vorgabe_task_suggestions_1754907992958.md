
# Delta-ID: task-suggestions-and-admin

## Ziel
Zwei neue Menüpunkte und eine kleine Daten-Schicht einführen:
1) **Aufgabe vorschlagen** – User wählt eine **Kategorie** und formuliert einen **Text**. Der Vorschlag wird lokal gespeichert (später ersetzbar durch echte Persistenz) und als **pending** markiert.
2) **Admin** – Nur für Admins sichtbar. Verwaltung der Vorschläge: **Freigeben**, **Ablehnen (mit Notiz)**, **Bearbeiten**, **Löschen**. Freigegebene Aufgaben landen (vorerst) nur in der lokalen Vorschlagsliste mit Status *approved* (kein Eingriff in `challenges.ts` – das folgt später).

---

## Menü-Erweiterungen
**Datei:** `src/config/menuItems.ts`
- **Nach „Aufgaben-Übersicht“ hinzufügen:**
  ```ts
  { key: 'menu.suggest', label: t('menu.suggest'), icon: '📝', path: '/tasks/suggest' },
  // nur für Admin
  { key: 'menu.admin',   label: t('menu.admin'),   icon: '🛡️', path: '/admin/tasks', adminOnly: true },
  ```
- **Sichtbarkeit**: Menü-Renderer blendet `adminOnly`-Einträge aus, wenn `isAdmin` (aus `AdminContext`) false ist.

**i18n:** `src/i18n/de.json` & `src/i18n/en.json`
```json
"menu": {
  "...": "...",
  "suggest": "Aufgabe vorschlagen",
  "admin": "Admin"
},
"suggest": {
  "title": "Aufgabe vorschlagen",
  "choose": "Kategorie wählen",
  "placeholder": "Formuliere deine Aufgabe...",
  "submit": "Senden",
  "thanks": "Danke! Deine Aufgabe wird geprüft."
},
"adminTasks": {
  "title": "Adminbereich",
  "pending": "Offene Vorschläge",
  "approved": "Freigegeben",
  "rejected": "Abgelehnt",
  "actions": {
    "approve": "Freigeben",
    "reject": "Ablehnen",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "save": "Speichern"
  },
  "note": "Notiz (optional)"
}
```

---

## Datenmodell & Context
**Neu:** `src/context/TaskSuggestionsContext.tsx`
```ts
export type SuggestionStatus = 'pending'|'approved'|'rejected'|'edited';
export interface TaskSuggestion {
  id: string;
  categoryId: string;
  text: string;
  status: SuggestionStatus;
  note?: string;
  author?: { uid?: string; email?: string|null };
  createdAt: number;
  updatedAt: number;
}

interface Ctx {
  items: TaskSuggestion[];
  add: (categoryId: string, text: string, author?: { uid?: string; email?: string|null }) => Promise<void>|void;
  approve: (id: string) => void;
  reject: (id: string, note?: string) => void;
  edit: (id: string, patch: Partial<Pick<TaskSuggestion, 'text'|'categoryId'|'note'>>) => void;
  remove: (id: string) => void;
  clear?: () => void;
}
```
- **Speicherung:** vorerst `localStorage` unter Key `taskSuggestions`.
- **Hydration:** beim Mount laden, bei Änderungen persistieren (debounced).
- **Integration:** Provider im `main.tsx`/`TabLayout.tsx` oberhalb der Routen einhängen (neben `AuthProvider`, `AdminProvider` etc.).

---

## Screens

### 1) Aufgabe vorschlagen
**Neu:** `src/features/Tasks/SuggestTaskScreen.tsx`
- **Imports:** `categories` aus `src/features/Arena/categories.ts`, `useTaskSuggestions()` aus Context, optional `useAuth()` für author.
- **UI:**
  - Select-Dropdown für Kategorien (`id`, `label` via i18n Schlüssel).
  - Textarea mit Placeholder.
  - Primary-Button „Senden“ → `add(categoryId, text, author)`.
  - Nach Erfolg: Input leeren und kleines „Danke“-Banner (`t('suggest.thanks')`).

- **Styles:** eigene `SuggestTaskScreen.module.css` oder Utility-Klassen – 44px Hit-Area, Card-/Glass-Optik passend zum Menü.

### 2) Admin – Vorschläge verwalten
**Neu:** `src/features/Tasks/AdminTasksScreen.tsx`
- **Imports:** `useTaskSuggestions()`, `useAdmin()`/`isAdmin` (Guard), `categories` für Labels.
- **UI-Blöcke:**
  - **Tabs oder Filter** für *Offen*, *Freigegeben*, *Abgelehnt*.
  - **Liste** je Status: Card mit Kategorie-Label, Text, Meta (Datum/Autor).
  - **Aktionen:** Freigeben, Ablehnen (mit optionaler Note), Bearbeiten (inline Textarea), Löschen.
- **Guard:** Wenn kein Admin → Redirect zur `/arena` oder Hinweis.

---

## Routing
**Datei:** `src/router.tsx`
```tsx
{ path: '/tasks/suggest', element: <SuggestTaskScreen /> },
{ path: '/admin/tasks',  element: <AdminTasksScreen /> }, // optional Guard-Wrapper
```
- Optional: `/menu?tab=suggest` kann intern auf `/tasks/suggest` weiterleiten.

---

## Kategorien & Aufgaben (Quelle)
- Kategorien: `src/features/Arena/categories.ts` (z.B. `id: 'fate'|'shame'|'seduce'|'escalate'|'confess'`).
- Aufgaben-Pool: **unverändert** `src/features/Arena/challenges.ts`.
- **Wichtig:** In dieser Iteration werden freigegebene Vorschläge **nicht automatisch** in `challenges.ts` geschrieben – nur Statuswechsel im Context. (Persistenzpfad wird in einer späteren Iteration ergänzt, z.B. Firebase/Firestore).

---

## Styling-Vorgaben (kurz)
- Übernehmen Sie die Glas-/Card-Styles aus dem Hamburger-Menü (border, backdrop-filter).
- Buttons: Primär/Akzent konsistent mit App-Design.
- Barrierefreiheit: Labels für Select/Textarea, `aria-*` an Buttons, min. 44×44 px.

---

## Akzeptanzkriterien
- [ ] Neuer Menüpunkt **„Aufgabe vorschlagen“** vorhanden, öffnet `/tasks/suggest`.
- [ ] Auswahl der Kategorie + Texteingabe + „Senden“ legt **pending**-Vorschlag an.
- [ ] Neuer Menüpunkt **„Admin“** (nur für Admins) zeigt `/admin/tasks`.
- [ ] Admin kann Vorschläge **freigeben**, **ablehnen** (mit Notiz), **bearbeiten**, **löschen**.
- [ ] Daten bleiben über Reload erhalten (localStorage).
- [ ] Keine Änderungen am bestehenden Aufgabenpool (`challenges.ts`) in dieser Iteration.
- [ ] UI folgt dem Glas-/Card-Stil, mobil bedienbar.
