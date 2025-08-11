# Fix für "Can't find variable: useCallback" im TabLayout

## Problem
In `src/layouts/TabLayout.tsx` wird `useCallback` verwendet, ohne es aus React zu importieren.
Dies führt zu folgendem Fehler:
```
Can't find variable: useCallback
```

## Lösungsschritte

### 1. React-Import korrigieren
Am Anfang der Datei `TabLayout.tsx` sicherstellen, dass `useCallback` mit importiert wird:

```ts
import React, { useState, useMemo, useCallback } from 'react';
```

Falls bereits `useState` oder `useMemo` vorhanden sind, einfach `useCallback` ergänzen.

---

### 2. Menü-Logik prüfen
Überprüfen, dass `useCallback` so eingesetzt wird:

```ts
const [isMenuOpen, setIsMenuOpen] = useState(false);

const openMenu = useCallback(() => setIsMenuOpen(true), []);
const closeMenu = useCallback(() => setIsMenuOpen(false), []);
```

---

### 3. Menü-Button anpassen
Beim Klick auf den Menü-Tab **nicht** navigieren, sondern Menü öffnen:

```ts
onClick={(e) => { 
    e.preventDefault(); 
    openMenu(); 
}}
```

---

### 4. Props an HamburgerMenu übergeben
```tsx
<HamburgerMenu open={isMenuOpen} onOpen={openMenu} onClose={closeMenu} />
```

---

## Ergebnis
- Der Fehler verschwindet
- Das Menü öffnet sich stabil und bleibt offen, bis der Nutzer es schließt
- Keine sofortige Schließung mehr nach dem Öffnen
