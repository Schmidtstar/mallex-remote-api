# MALLEX – Phase 3 Patches & Agent-Anleitung

**Ziel:** Altlasten sauber verschieben, ungenutzte Datei(en) bereinigen, und die Änderungen verifizieren.  
**Kontext:** Spacing-/UX-Optimierungen sind umgesetzt. Es gab noch ungenutzte Dateien und eine mutmaßlich verwaiste CSS-Datei.

---

## 1) Änderungen (kurz)

- **Verschieben (statt Löschen):**
  - `src/lib/playersApi.ts` → `src/deprecated/playersApi.ts`
  - `src/lib/suggestionsApi.ts` → `src/deprecated/suggestionsApi.ts`
  - `src/utils/env.ts` → `src/deprecated/env.ts`

- **Aufräumen Arena-CSS (konservativ):**
  - `src/features/Arena/ArenaScreen.module.css` **entfernen**, **falls** sie im Code **nirgendwo importiert** wird.
  - (Begründung: Kein Treffer in Code-Suche; verhindert tote Assets. Falls die Datei künftig gebraucht wird, kann sie wieder eingeführt werden.)

---

## 2) Shell-Kommandos (idempotent & sicher)

> Diese Kommandos dürfen mehrfach laufen, ohne Schaden anzurichten.

```bash
# 2.1 Sicherstellen, dass deprecated-Ordner existiert
mkdir -p src/deprecated

# 2.2 Dateien verschieben (falls vorhanden)
[ -f src/lib/playersApi.ts ] && git mv -f src/lib/playersApi.ts src/deprecated/playersApi.ts || true
[ -f src/lib/suggestionsApi.ts ] && git mv -f src/lib/suggestionsApi.ts src/deprecated/suggestionsApi.ts || true
[ -f src/utils/env.ts ] && git mv -f src/utils/env.ts src/deprecated/env.ts || true

# 2.3 Arena-CSS nur löschen, wenn nirgendwo referenziert
if [ -f src/features/Arena/ArenaScreen.module.css ]; then
  if ! grep -R "ArenaScreen.module.css" src >/dev/null 2>&1; then
    git rm -f src/features/Arena/ArenaScreen.module.css
  fi
fi
```

**Commit:**  
```bash
git add -A
git commit -m "chore(cleanup): move unused libs to src/deprecated and remove unreferenced Arena CSS"
```

---

## 3) Verifikation (nach den Änderungen)

```bash
# 3.1 Build prüfen
npm run build || yarn build || pnpm build

# 3.2 Schnelltests (App muss starten, Navigation muss funktionieren)
npm run dev &  # oder: vite / replit-run (je nach Umgebung)
# -> Im Browser manuell prüfen: Arena, Legends, Menu, Tasks-Übersicht, Vorschlagen, Admin
# -> BottomNavigation & Hamburger: Tap-Ziele >= 48px, States sichtbar
# -> Keine 404/Import-Fehler in der Konsole
```

**Statische Checks (optional):**
```bash
# Import-Graph / tote Dateien (falls Skript vorhanden)
npm run depcheck || true

# Type-Check / Lint
npm run typecheck || true
npm run lint || true
```

---

## 4) Rückfall / Undo

Falls wider Erwarten eine der verschobenen Dateien doch gebraucht wird:

```bash
git restore --staged src/deprecated/playersApi.ts src/deprecated/suggestionsApi.ts src/deprecated/env.ts || true
git mv -f src/deprecated/playersApi.ts src/lib/playersApi.ts || true
git mv -f src/deprecated/suggestionsApi.ts src/lib/suggestionsApi.ts || true
git mv -f src/deprecated/env.ts src/utils/env.ts || true
git commit -m "revert(cleanup): restore moved files" || true
```

---

## 5) Hinweise

- `generated-icon.png` ist **korrekt** in `index.html` eingebunden – **nicht löschen**.
- i18n-Dateien (`src/i18n/*`) werden über `import './i18n'` als **Side-Effect** geladen – **behalten**.
- Der Import der BottomNavigation ist korrekt (`default`).

**Definition of Done für diesen Patch:**  
- Keine ungenutzten Dateien mehr in `src/lib` bzw. `src/utils`.  
- Arena-CSS nur vorhanden, wenn auch wirklich importiert.  
- Projekt baut fehlerfrei; Hauptscreens rendern.
