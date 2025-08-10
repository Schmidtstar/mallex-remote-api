# MALLEX – Delta Prompt: Replit PORT/Run-Konsistenz (statisch, sicher)

## Ziel
Behebe das Problem, dass `npm run dev -- --host --port $PORT` fehlschlägt (`value is missing`).  
Stelle sicher, dass **Run-Button** und **Workflows** konsistent starten – ohne Shell/Runtime-Aktionen auszuführen.

> **Wichtig:** Keine Builds/Installs/Starts durchführen. Nur statische Datei-Anpassungen.

---

## Aufgaben (nur Code/Config-Änderungen)

### 1) `.replit` vereinfachen und PORT nicht mehr direkt übergeben
- Setze den **Run**-Befehl so, dass **kein** `--port $PORT` mehr übergeben wird:
```ini
language = "nodejs"
run = "npm run dev -- --host"

[env]
VITE_HASH_ROUTER = "1"
```
- Entferne ggf. überflüssige/konfliktträchtige `[[workflows.workflow]]`-Definitionen oder passe sie analog an, **ohne** zusätzliche Shell-Kommandos einzubauen.

### 2) `vite.config.ts` so anpassen, dass der Port aus `process.env.PORT` gelesen wird (Fallback 3000)
- Ergänze/vereinheitliche die Server-Optionen wie folgt:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.PORT) || 3000,
    hmr: { clientPort: 443 },
    allowedHosts: true
  },
  preview: {
    host: true,
    port: 4173
  }
});
```
- Hinweis: `vite.config.ts` läuft in Node und kann `process.env.PORT` lesen; damit ist kein `--port` in `.replit`/Workflows nötig.

### 3) Workflows an `.replit` angleichen (nur wenn vorhanden)
- Falls ein Workflow „Run“ existiert, **ersetze** den Shell-Befehl durch exakt:
```
npm run dev -- --host
```
- Keine expliziten `--port`-Flags im Workflow verwenden.

---

## Akzeptanzkriterien (Ja/Nein prüfbar)
- [ ] `.replit` enthält **kein** `--port $PORT` mehr; `run = "npm run dev -- --host"` ist gesetzt.
- [ ] `vite.config.ts` liest `process.env.PORT` und hat Fallback `3000`.
- [ ] Optionaler Workflow „Run“ nutzt ebenfalls **ohne** `--port` denselben Befehl.
- [ ] Keine weiteren Änderungen an Paketen/Abhängigkeiten/Buildskripten.

---

## Report (kurz)
- Liste die geänderten Dateien (mit Diff-Ausschnitten) und bestätige, dass keine weiteren Bereiche verändert wurden.
- Nenne 1–2 Sätze, warum diese Lösung auf Replit stabiler ist (Port aus Env in `vite.config.ts`, nicht aus `.replit`).

---

## Hinweise an den Nutzer (nicht ausführen, nur notieren)
- Nach Merge der Änderungen:  
  1) `npm install` (falls noch nicht)  
  2) **Run** klicken oder `npm run dev`  
  3) Preview im neuen Tab öffnen → `/#/auth`
