# Fix: Menü-Tab öffnet Hamburger-Drawer stabil (kein Auto-Schließen)

**Delta-ID:** `tabbar-hamburger-stability`  
**Ziel:** Wenn der Menü-Tab (≡) in der Bottom-Tabbar geklickt wird, soll der Hamburger-Drawer **offen bleiben** und **nicht sofort** durch einen Route-Wechsel wieder schließen. Der Drawer darf bei **späteren** Navigationswechseln (z. B. nach Auswahl eines Menüpunktes) wieder automatisch schließen.

---

## Änderungen (exakt)

### 1) `src/components/HamburgerMenu.tsx`
- **Problem:** `useEffect` schließt den Drawer bei jedem `location.pathname`-Wechsel, auch direkt nach dem Öffnen (Race-Condition).
- **Lösung:** „Schonfrist“-Guard einbauen: Wechsel der Route in den ersten 400 ms nach dem Öffnen **ignorieren**.

**Patch (Richtlinie – bitte sauber integrieren):**
```tsx
// imports
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // ...restliche Props
};

export default function HamburgerMenu({ isOpen, onClose /*, ...*/ }: Props) {
  const location = useLocation();
  const lastOpenAtRef = useRef<number>(0);

  // Zeitstempel setzen, sobald der Drawer geöffnet wird
  useEffect(() => {
    if (isOpen) {
      lastOpenAtRef.current = Date.now();
    }
  }, [isOpen]);

  // Nur schließen, wenn der Öffnen-Zeitpunkt > 400ms zurückliegt
  useEffect(() => {
    if (!isOpen) return;
    const msSinceOpen = Date.now() - lastOpenAtRef.current;
    if (msSinceOpen < 400) return; // Schonfrist
    onClose();
  }, [location.pathname, isOpen, onClose]);

  // ESC schließt
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // TODO: Backdrop onClick => onClose (falls nicht vorhanden)
  // return (...)
}
```

> **Hinweis:** Wenn im Drawer-Menü beim Klicken auf einen Eintrag navigiert wird, **bewusst** schließen:
> ```tsx
> // Beispiel im Drawer-Item-Handler
> const handleNavigate = (to: string) => {
>   navigate(to);
>   onClose();
> };
> ```

---

### 2) `src/layouts/TabLayout.tsx`
- **Problem:** Der Menü-Tab triggert Navigation (z. B. `/menu`) und verursacht direkt danach den `location`-Wechsel.
- **Lösung:** Der Menü-Tab **öffnen den Drawer über State**; Navigation optional/sekundär.

**Patch (Richtlinie – bitte an eure BottomNavigation-API anpassen):**
```tsx
import { useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function TabLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  // const navigate = useNavigate();

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    // Optional: Wenn ihr /menu als Route beibehalten wollt, kann das hier passieren.
    // navigate("/menu");
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      {/* ... euer Haupt-Content (Outlet etc.) ... */}

      {/* Bottom Tabs */}
      <BottomNavigation
        items={[
          { key: "arena",   icon: "🏟️", to: "/arena" },
          { key: "legends", icon: "🏛️", to: "/legends" },
          // Menü-Tab: kein "to", sondern Click-Handler
          { key: "menu",    icon: "≡", onClick: openMenu, isButton: true },
        ]}
      />

      {/* Drawer */}
      <HamburgerMenu isOpen={menuOpen} onClose={closeMenu} />
    </>
  );
}
```

> **Wichtig:** Falls `BottomNavigation` kein `onClick`/`isButton` kennt, bitte den Menü-Tab als `<button>` rendern oder `e.preventDefault()` im `onClick` nutzen, damit **keine** Navigation ausgelöst wird.

---

## Aufräumen (falls zutreffend)
- Falls nicht mehr benötigt: die Route `/menu` im Router entfernen.
- Prüfen, ob irgendwo ein automatisches `navigate('/menu')` beim Rendern ausgeführt wird – das **entfernen**.
- Sicherstellen, dass Backdrop-Klick und ESC den Drawer schließen.

---

## Abnahmekriterien (Akzeptanztests)

1. **Tab → Menü**  
   - Tap auf das Menü-Icon (≡) in der Tabbar öffnet den Drawer.  
   - Der Drawer bleibt offen, schließt **nicht** sofort.

2. **Item-Klick im Drawer**  
   - Klick auf einen Menüeintrag navigiert zur Zielseite **und** schließt den Drawer.

3. **Navigation außerhalb des Drawers**  
   - Wechsel auf einen anderen Tab (Arena/Legends) schließt den Drawer, falls er offen war.

4. **ESC / Backdrop**  
   - ESC-Taste und Klick auf den Backdrop schließen den Drawer.

5. **HMR / Reload**  
   - Kein Flackern/Auto-Close nach HMR-Updates.
   - Kein ungewolltes Routing zu `/menu` beim Öffnen.

---

## Hinweise zur Umsetzung
- Die 400 ms Schonfrist kann bei Bedarf angepasst werden (`300–500 ms` sind meist stabil).  
- Wenn /menu als Deeplink weiterhin unterstützt werden soll, **lassen** wir die Route bestehen – die Schonfrist verhindert den Sofort-Close trotzdem.  
- Accessibility: `role="dialog"` + `aria-modal="true"` im Drawer setzen und Fokus-Management beibehalten.

---

## Checkliste „Done“
- [ ] `HamburgerMenu.tsx`: Guard mit `lastOpenAtRef` implementiert.
- [ ] `TabLayout.tsx`: Menü-Tab öffnet Drawer über State (keine erzwungene Navigation).
- [ ] Drawer schließt bei Item-Klick, ESC und Backdrop.
- [ ] Optional: `/menu`-Route entfernt oder geprüft.
- [ ] Manuelles QA gemäß Abnahmekriterien erfolgreich.

