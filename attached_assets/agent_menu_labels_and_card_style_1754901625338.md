
# Vorgabe für den Agenten: Menü-Labels und Karten-Styling

## Ziel
Das Hamburger-Menü soll inhaltlich und optisch an das gewünschte Design angepasst werden.

---

## Aufgaben

### 1. Korrektur der Menü-Labels
- Aktuell werden einige Keys wie `key 'menu.profile (de)' returned an object instead of string` angezeigt.
- **Ziel:** Alle Menüeinträge sollen aus den i18n-Dateien (`de.json`, `en.json`) korrekt als Strings geladen werden.
- Falls Werte aktuell Objekte sind, müssen sie auf einfache Strings angepasst werden.

### 2. Neue Überschriften und Begriffe
Die Menüeinträge sollen folgende deutschen Bezeichnungen haben (englische entsprechend anpassen):

1. **Einstellungen**
2. **Profil**
3. **Aufgaben**
4. **Vorschlagen**
5. **Rangliste**
6. **Spielregeln**
7. **Über MALLEX**
8. **Aufgaben-Manager** (Admin)
9. **Entwickler-Manager** (Admin)

Reihenfolge und Gruppierung sollen wie bisher erhalten bleiben.

### 3. Rahmen-/Karten-Styling
- Jeder Menüpunkt soll wie im Referenzbild (zweites Bild vom Nutzer) **eingefasst** sein, mit abgerundeten Ecken und einem leicht transparenten Hintergrund.
- Abstände zwischen den Einträgen wie im Beispielbild.
- Icons bleiben erhalten.
- Hover-/Active-State: leichte Farbänderung.

### 4. Technische Umsetzung
- Menüstruktur soll **zentral** aus einer Config-Datei kommen (`src/config/menuItems.ts`), statt hartkodiert in `HamburgerMenu.tsx`.
- `HamburgerMenu.tsx` rendert dynamisch anhand dieser Config.
- Admin-Einträge werden wie bisher per Flag ausgeblendet.

### 5. Abnahmekriterien
- Alle Labels kommen aus i18n und zeigen keine `key ... returned object` Fehler mehr.
- Reihenfolge entspricht Vorgabe.
- Optik entspricht Beispielbild.
- Rahmen-/Card-Styling funktioniert in Light- und Darkmode.
- Admin-Einträge nur sichtbar, wenn User Admin ist.

---

**Hinweis:** Design soll sich an der Glas-Optik des zweiten Screenshots orientieren.
