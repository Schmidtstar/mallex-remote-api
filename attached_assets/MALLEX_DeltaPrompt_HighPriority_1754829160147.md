# MALLEX – Delta Prompt: Hoch-Priorität-Fixes

## Ziel
Führe **nur** die folgenden drei Änderungen am bestehenden MALLEX-Projekt durch, ohne weitere Strukturen oder Logik zu verändern.  
Die funktionierende Basis darf **nicht** gefährdet werden.

---

## Änderungen

### 1. Duplicate Workflow in `.replit` entfernen
- Prüfe `.replit` auf doppelte `[[workflows.workflow]]` Einträge mit `name = "Run"`.
- Behalte **nur einen** `Run`-Workflow.
- Keine weiteren Workflows ändern oder löschen.

---

### 2. Hardcoded Strings in `categories.ts` i18n-konform machen
- **Datei:** `src/features/Arena/categories.ts`
- Alle sichtbaren deutschen Texte in den `items[]` durch i18n-Keys ersetzen.
  - Beispiel:
    ```ts
    // Vorher
    'Wähle eine Person, die 2 Schluck trinkt.'
    // Nachher
    t('arena.fate.item1')
    ```
- Neue Keys in `de.json` und `en.json` anlegen:
  - **de.json** → Originaltexte auf Deutsch
  - **en.json** → Englische Übersetzungen
- i18n importieren, falls nicht vorhanden:
  ```ts
  import { useTranslation } from 'react-i18next';
  ```
- Nur diese Datei anpassen, keine anderen Features oder Kategorien verändern.

---

### 3. Firebase-Import und Syntaxfehler in `firebase.ts` beheben
- **Datei:** `src/lib/firebase.ts`
- Fehlende schließende Klammer im `return` ergänzen.
- Code auf saubere Klammerung und Syntaxfehler prüfen.
- Keine Logik ändern, nur Syntaxfehler beheben.

---

## Arbeitsweise
- Änderungen **einzeln und nacheinander** durchführen.
- Nach jeder Änderung kurze Bestätigung im Format:
  ```
  ✅ Fix <Nummer> erledigt – <Kurze Beschreibung>
  ```
- **Keine** Shell-Kommandos, Builds oder Tests ausführen.
- Nur Codeänderungen vornehmen, **keine** Pakete installieren oder entfernen.

---

## Akzeptanzkriterien
- `.replit` enthält **nur einen** funktionierenden `Run`-Workflow.
- `categories.ts` nutzt ausschließlich i18n-Keys, keine Hardcodes mehr.
- `firebase.ts` ist syntaktisch korrekt und kompiliert fehlerfrei.
