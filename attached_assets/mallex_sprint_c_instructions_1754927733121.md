# MALLEX – Sprint C (UX/A11y & Mobile-Polish für Hamburger-Drawer + Menü)
_Ziel: Bessere Bedienbarkeit auf Mobile, sauberes A11y, konsistente Darstellung. Nur Code/Dateien ändern, keine Shell-Kommandos._

---

## 0) Leitplanken
- Es gibt **nur EIN** Hamburger-Menü (Drawer) – das in der **Tab-Bar**.
- Drawer verhält sich wie ein **Dialog**: Fokusfalle, `aria-*`, ESC, Backdrop, Body-Scroll-Lock.
- Touch-Hit-Areas ≥ **44×44 px**; klare Abstände & Lesbarkeit.

---

## 1) Drawer A11y & Verhalten finalisieren

### 1.1 `src/components/HamburgerMenu.tsx`
**Änderungen:**
- Dialog-Rollen und ARIA:
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby="menuTitle"`
- Fokus-Management:
  - Beim Öffnen: Fokus auf ersten interaktiven Menüpunkt.
  - Beim Schließen: Fokus zurück auf Trigger-Button.
  - ESC-Key schließt den Drawer.
- Fokusfalle:
  - Tab/Shift+Tab zirkuliert innerhalb des Drawers.
- Body-Scroll-Lock:
  - Beim Öffnen `document.body.style.overflow='hidden'`,
  - Beim Schließen zurücksetzen.
- Backdrop-Klick schließt Drawer.
- Route-Wechsel: Drawer schließt automatisch.

**Pseudopatch (Ausschnitt):**
```tsx
// imports: useRef, useEffect, useCallback
const triggerRef = useRef<HTMLButtonElement|null>(null);
const drawerRef = useRef<HTMLDivElement|null>(null);

useEffect(() => {
  if (open) {
    const first = drawerRef.current?.querySelector<HTMLElement>('button, a, [tabindex="0"]');
    first?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }
}, [open]);

const onKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === 'Escape') close();
  if (e.key === 'Tab') trapFocus(e, drawerRef.current);
}, [close]);

// Beim Schließen Fokus zurück
useEffect(() => {
  if (!open) triggerRef.current?.focus();
}, [open]);
```

### 1.2 `src/components/HamburgerMenu.module.css`
**Ziele:**
- Hit-Areas ≥ 44px (Padding/Line-Height erhöhen).
- Lesbarkeit auf Mobile (Font-Size, Spacing).
- Fokus-Styles sichtbar (outline/focus-ring).

**Beispiel (Ausschnitt):**
```css
.trigger {
  width: 44px; height: 44px; /* minimale Hit-Area */
  display: inline-flex; align-items: center; justify-content: center;
}

.drawer {
  position: fixed; inset: 0 0 0 auto;
  width: min(90vw, 360px);
  background: rgba(20,20,28,0.9);
  backdrop-filter: blur(12px);
  border-left: 1px solid rgba(255,255,255,0.08);
  outline: none;
}

.itemBtn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; text-align: left;
  padding: 12px 16px;
  line-height: 1.25;
  min-height: 44px;
  border-radius: 10px;
}

.itemBtn:focus-visible {
  outline: 2px solid rgba(255,255,255,0.6);
  outline-offset: 2px;
}
```

### 1.3 Fokusfalle-Helfer
**Datei (neu):** `src/lib/a11y.ts`
```ts
export function trapFocus(e: React.KeyboardEvent, root: HTMLElement | null) {
  if (!root) return;
  const focusables = root.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}
```

---

## 2) Menü-Texte & Struktur (Mobile-Lesbarkeit)

### 2.1 i18n-Labels prüfen
**Dateien:** `src/i18n/de.json`, `src/i18n/en.json`  
**Check:** „Arena“, „Halle der Legenden“, „Profil“, „Einstellungen“, „Aufgaben-Übersicht“, „Aufgabe vorschlagen“, „Admin“ sind **Strings**.

### 2.2 Menü-Gruppierung (optional, falls noch nicht)
**Datei:** `src/config/menuItems.ts`  
**Aktion:** Gruppen logisch sortieren (z. B. _Spiel_, _Konto_, _Aufgaben_), Icons konsistent; keine `alert()`-Platzhalter – echte Navigation.

---

## 3) Tab-Bar Integration (Konsistenz)

### 3.1 `src/layouts/TabLayout.tsx`
- Hamburger-Trigger ersetzt Menü-Tab an letzter Position.
- Trigger hat `aria-label="Menü"` (i18n), `ref={triggerRef}` (für Fokus-Rückgabe).
- Kein zweites, altes Drawer/Popup im DOM.

**Ausschnitt:**
```tsx
<button
  ref={triggerRef}
  className={styles.trigger}
  aria-label={t('tabs.menu')}
  onClick={() => setOpen(true)}
>
  ≡
</button>
```

---

## 4) Akzeptanzkriterien (Abnahme)

- [ ] Es existiert **nur ein** Drawer; Klick auf ≡ in der Tab-Bar öffnet ihn.  
- [ ] Drawer hat `role="dialog"`, `aria-modal="true"`, Label-ID ist korrekt verknüpft.  
- [ ] ESC & Backdrop schließen, Body-Scroll ist gesperrt.  
- [ ] Fokusfalle funktioniert (Tab/Shift+Tab bleibt im Drawer).  
- [ ] Beim Schließen fokussiert die App den Trigger-Button zurück.  
- [ ] Alle Menüpunkte haben ≥44px Hit-Area und sichtbare Focus-Styles.  
- [ ] Mobile-Lesbarkeit: ausreichende Abstände, kein Text-Clipping.  
- [ ] Keine doppelten Menü-/Drawer-Komponenten im DOM/Code.

---

## 5) Reporting
Bitte nach Umsetzung:
- Geänderte Dateien auflisten.
- Kurz bestätigen: A11y-Check (Dialog-Rollen, ESC, Fokusfalle, Body-Scroll-Lock) bestanden.
