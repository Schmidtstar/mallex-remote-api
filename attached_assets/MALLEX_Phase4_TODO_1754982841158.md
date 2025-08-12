# MALLEX – Phase 4 To-Do (Agenten-Anleitung)

> Ziel: Finaler Review & Release-Check – alle Schritte in der richtigen Reihenfolge ausführen.

---

## 1) Technisches Audit

```bash
# 1.1 Import-Graph / tote Imports prüfen (falls depcheck vorhanden)
npm install -g depcheck || true
depcheck || true

# 1.2 Lint
npm run lint

# 1.3 TypeScript-Check
npm run typecheck

# 1.4 Build
npm run build
```

**Erwartung:** Keine Fehlermeldungen, keine Warnungen, keine toten Imports.

---

## 2) Responsiveness prüfen (manuell)

- Mobile Portrait (≤ 480px): Navigation, HamburgerMenu, Arena/Legends-Listen – keine Überläufe
- Mobile Landscape: BottomNav & HamburgerMenu korrekt dargestellt
- Tablet/Desktop: Keine übermäßigen Leerräume, keine abgeschnittenen Inhalte

---

## 3) QA mit allen Rollen (manuell)

- Rollen: Gast, registrierter User, Admin
- Screens: Arena, Legends, Menu, Tasks-Übersicht, Vorschlagen, Admin
- Prüfen: Buttons ≥ 48px Höhe, Hover-/Focus-/Active-States sichtbar, **keine** Fehler in der Browser-Konsole

---

## 4) Design-Feinschliff

- Abstände ausschließlich über Spacing-Tokens (`--space-*`), keine harten px-Werte
- Einheitliche Typografie (ggf. Typo-Tokens für H1/H2/H3 ergänzen)
- Konsistente Icon-Größen und Label-Ausrichtung

---

## 5) Performance- & Accessibility-Test

```bash
# Lighthouse (Chrome DevTools > Lighthouse)
# Zielwerte:
# Performance  >= 85
# Accessibility >= 95
# Best Practices / SEO >= 90
```
Falls unter Ziel: Bilder optimieren / Lazy Loading prüfen, Kontraste & Fokus-Indikatoren verbessern.

---

## 6) Abschluss

```bash
# QA-Dokumentation (Screens × Rollen × OK/Fehler) erstellen

# Release-Tag setzen
git tag v1.0.0
git push origin v1.0.0
```
**Definition of Done:** Keine toten Imports; Lint/Typecheck/Build fehlerfrei; UI konsistent (Spacing, Typografie, Icons); Responsive; Lighthouse-Ziele erreicht; QA-Doku vollständig.
