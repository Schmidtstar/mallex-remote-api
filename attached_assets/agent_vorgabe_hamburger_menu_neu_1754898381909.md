
# Delta-ID: hamburger-menu-tabbar-integration

## Ziel
Die bisherige Menüfunktion (unten rechts in der Tab-Bar) vollständig entfernen und die Funktionalität in das bestehende Hamburger-Menü integrieren.
Das Hamburger-Menü-Icon soll jedoch an der Position des bisherigen Menü-Tabs in der Tab-Bar angezeigt werden.

---

## Details / Anforderungen

1. **Alte Menüfunktion entfernen**
   - Alle Komponenten, Hooks und Styles, die ausschließlich für das aktuelle Menü-Tab unten rechts zuständig sind, löschen.
   - Alle Routen und Einbindungen, die auf diese Menüfunktion zeigen, entfernen.

2. **Hamburger-Menü in Tab-Bar integrieren**
   - An der Position, an der momentan das Menü-Tab unten rechts angezeigt wird, das Hamburger-Menü-Icon `≡` anzeigen.
   - Klick auf dieses Icon öffnet das bestehende Hamburger-Menü (Side Drawer / Offcanvas Menu).

3. **Navigation & Inhalte**
   - Hamburger-Menü soll nach wie vor die bestehenden Menüeinträge enthalten:
     - Einstellungen
     - Profil (inkl. Login/Logout oder Gast → Registrierungsfenster)
     - Aufgabenübersicht (Kategorien: Schicksal, Schande, Verführung, Eskalation, Beichte mit Aufgabenliste)
     - Aufgaben vorschlagen
     - Adminbereich
   - Die Funktionalität muss identisch mit dem aktuellen Hamburger-Menü bleiben.

4. **Styling**
   - Das Hamburger-Menü-Icon in der Tab-Bar soll den gleichen optischen Stil (Größe, Abstand, Hover-Effekt) wie die anderen Tabs haben.
   - Aktiver Zustand: Leichte Hintergrundmarkierung oder farbige Hervorhebung.

5. **Bereinigung**
   - Codebereinigung durchführen, ungenutzte Dateien/Komponenten löschen, die nur für die alte Menü-Tab-Funktion zuständig waren.
   - Sicherstellen, dass keine doppelten Menükomponenten existieren.

---

## Akzeptanzkriterien
- [ ] Klick auf Hamburger-Icon in der Tab-Bar öffnet das Menü
- [ ] Alte Menü-Tab-Komponente unten rechts vollständig entfernt
- [ ] Alle Inhalte aus bisherigem Hamburger-Menü sind unverändert verfügbar
- [ ] Styling in Tab-Bar konsistent mit anderen Tabs
- [ ] Keine doppelten Menüstrukturen mehr im Code
