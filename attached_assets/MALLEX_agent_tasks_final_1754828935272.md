# MALLEX – Agent Analyse & Feedback-Anfrage

## Ziel
Das bestehende MALLEX-Projekt (React + Vite + TypeScript + Firebase Auth + i18n) soll **kritisch überprüft** werden.  
Der Fokus liegt auf **Codequalität, Architektur, Konsistenz und Produktionsreife** – ohne vollständigen Neuaufbau.

---

## Aufgaben für den Replit-Agenten

### 1. Status-Check (statische Code-Analyse)
- Prüfe, ob **ENV-Variablen-Namen** konsistent sind (`VITE_HASH_ROUTER` vs. `VITE_USE_HASH_ROUTER`).
- Untersuche, ob **Firebase-Config** korrekt ENV-basiert geladen wird (kein Hardcode).
- Stelle fest, ob **i18n** konsequent in allen Komponenten verwendet wird (keine Hardcoded UI-Texte).
- Analysiere, ob **Routing-Logik** im `router.tsx` sauber strukturiert und erweiterbar ist.
- Erkenne überflüssige oder doppelte Dateien (Ballast).
- Prüfe, ob `.replit` und `vite.config.ts` optimal für Replit konfiguriert sind.

### 2. Architektur-Bewertung
- Ist die **Feature-Ordnerstruktur** konsistent umgesetzt (features/, layouts/, components/, context/, lib/, i18n/, styles/)?
- Sind **zustandsbezogene Logiken** korrekt gekapselt (AuthContext, Hooks)?
- Werden **Komponenten sauber getrennt** nach Präsentations- und Logikanteilen?

### 3. Qualität & Wartbarkeit
- Gibt es **unbenutzte Imports** oder nicht genutzte Abhängigkeiten in `package.json`?
- Werden **TypeScript-Typen** konsequent genutzt (strict mode)?
- Ist das **Error-Handling** robust (ErrorBoundary, try/catch in kritischen Bereichen)?
- Sind **Loading-States** sinnvoll und nutzerfreundlich gestaltet?

### 4. UX & Performance
- Ist das Layout **mobile-first** und responsiv?
- Sind Swipe-Interaktionen performant und ohne externe Libs umgesetzt?
- Gibt es Performance-Bottlenecks (große Assets, unnötige Re-Renders)?

### 5. Offene Fragen an den Agenten
1. Welche **kritischen Schwachstellen** siehst du im aktuellen Code?
2. Wo würdest du **zuerst optimieren**, um die App production-ready zu machen?
3. Gibt es Stellen, die **künftige Gameplay-Features** behindern könnten?
4. Fehlen deiner Meinung nach wichtige **Tests oder Validierungen**?
5. Welche **Pakete** würdest du entfernen oder hinzufügen?
6. Würdest du die **Swipe-Implementierung** so lassen oder optimieren?

---

## Wichtig
- **Keine Shell-Befehle ausführen** – nur statische Analyse und Codeänderungsvorschläge.
- Bei Änderungsvorschlägen **immer Begründung angeben**.
- Nur konkrete, messbare Verbesserungen empfehlen.

---

## Erwartetes Ergebnis
Ein **detaillierter Analysebericht** mit:
- Liste der gefundenen Probleme
- Empfehlungen mit Begründung
- Priorisierung der Maßnahmen (hoch/mittel/niedrig)
- Einschätzung, ob das Projekt in aktuellem Zustand deploybar ist
