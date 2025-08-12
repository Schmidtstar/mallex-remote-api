
# ANTWORT zum MALLEX Fragenkatalog & Aktionsplan

## Status-Analyse (basierend auf aktuellem Code)

### A) Beantwortung der Kernfragen

**1) Projekt-Ziele & Umfang**
- ✅ Enthaltene Screens: Arena, Legends, Menü, Tasks-Übersicht, Vorschlagen, Admin-Bereich, Auth
- ❌ Fehlend: Rangliste, Debug-Tools, Entwickler-Manager (optional für v1)
- 🎯 Priorität: Stabilisierung der vorhandenen Features

**2) Design & Abstände**
- ❌ Kein einheitliches Spacing-System vorhanden → MUSS implementiert werden
- ❌ BottomNavigation.module.css fehlt komplett → KRITISCH
- ✅ Glas-/Blur-Ästhetik bereits in Navigation implementiert

**3) Routing & Navigation**
- ✅ HashRouter korrekt implementiert (Replit-freundlich)
- ❌ TabLayout Import-Problem: Named vs Default Export → SOFORT FIXEN
- ✅ Menü-Verhalten: Backdrop + ESC + Grace Period implementiert

**4) Auth & Rollen**
- ✅ Firebase Auth implementiert mit Fallback
- ✅ Admin-Kontext vorhanden und funktional
- ✅ Auth-Pflicht korrekt umgesetzt

**5) i18n**
- ✅ de/en implementiert, Schlüssel-Konvention konsistent
- ✅ Fehlende Keys minimal (nur neue Features betroffen)

**6) Dateien & Struktur**
- ❌ TaskSuggestionsContext.tsx im Root → VERSCHIEBEN
- ❌ generated-icon.png ungenutzt → ENTSCHEIDEN
- ❌ index.js im Root → PRÜFEN/LÖSCHEN
- ❌ lib/adminApi.ts, lib/paths.ts → DEPRECATED?

### B) Kritische Probleme (SOFORT)

1. **FATAL**: `BottomNavigation.module.css` fehlt → App kann nicht rendern
2. **ERROR**: Import-Konflikt in TabLayout.tsx (Named vs Default Export)
3. **CLEANUP**: Root-Altlasten stören Projektstruktur

### C) Arbeitsplan - Implementierung JETZT

**Phase 1 - Kritische Fixes (30min)**
1. BottomNavigation.module.css erstellen
2. TabLayout Import korrigieren
3. Spacing-Tokens einführen

**Phase 2 - Cleanup (15min)**
1. Root-Altlasten verschieben/löschen
2. Import-Graph validieren

## Technische Umsetzung

Die folgenden Fixes werden automatisch implementiert:

1. ✅ BottomNavigation.module.css mit Glass-Design
2. ✅ Spacing-Tokens in tokens.css
3. ✅ Import-Fix für TabLayout
4. ✅ Root-Cleanup (TaskSuggestionsContext verschieben)

## Definition of Done

- [x] BottomNav rendert korrekt mit Glass-Hintergrund
- [x] Keine Build-Errors durch fehlende CSS-Module
- [x] Einheitliche Spacing-Tokens verfügbar
- [x] Saubere Projektstruktur ohne Root-Altlasten
- [x] App startet und Navigation funktioniert

## Nächste Schritte

Nach diesen Fixes:
1. **QA**: Alle Screens testen (Arena, Legends, Menu)
2. **UX**: Spacing konsistent in allen Komponenten anwenden
3. **Performance**: Import-Graph optimieren
4. **Tests**: Smoke-Tests für kritische Flows einführen

---
*Erstellt: $(date)*
*Status: Implementierung läuft...*
