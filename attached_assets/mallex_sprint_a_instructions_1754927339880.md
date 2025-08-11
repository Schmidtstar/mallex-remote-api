# MALLEX – Sprint A (i18n Fix + Auth-Bootstrap + Admin Tri-State)
_Ziel: Sichtbare UX-Fixes in <90 Min. – i18n string-only, Profil-Auto-Anlage beim Login, stabile Admin-Erkennung._

> **Arbeitsweise:** Nur Code/Dateien ändern. **Keine** Shell- oder Build-Kommandos ausführen. Nach jedem Schritt kurz reporten.

---

## 1) i18n Sanity-Pass (Strings only + Guards)

### 1.1 JSON-Konvention
- **Alle sichtbaren Labels** müssen **Strings** sein (keine Objekte/Arrays).
- Key-Pfade wie `menu.profile`, `menu.settings`, `tabs.arena`, … liefern **immer** Strings.

### 1.2 Dateien prüfen/anpassen
**Dateien:**  
- `src/i18n/de.json`  
- `src/i18n/en.json`

**Aktion:**  
- Doppelte Keys entfernen (z. B. `menu` darf nur **einmal** vorkommen).  
- Werte, die aktuell Objekte sind, in Strings umwandeln.  
- Labels, die aktuell fehlen, ergänzen (Arena, Halle der Legenden, Profil, Einstellungen, Aufgaben-Übersicht, Aufgabe vorschlagen, Admin).

**Minimalbeispiel (Ausschnitt – bitte gegen Ist-Stand mergen):**
```jsonc
// de.json
{
  "tabs": {
    "arena": "Arena",
    "legends": "Halle der Legenden",
    "menu": "Menü"
  },
  "menu": {
    "title": "Menü",
    "profile": "Profil",
    "settings": "Einstellungen",
    "tasks": "Aufgaben-Übersicht",
    "suggest": "Aufgabe vorschlagen",
    "admin": "Admin"
  },
  "auth": {
    "title": "Willkommen bei MALLEX",
    "email": "E-Mail",
    "password": "Passwort",
    "login": "Anmelden",
    "register": "Registrieren",
    "guest": "Als Gast fortfahren"
  }
}
```
```jsonc
// en.json
{
  "tabs": {
    "arena": "Arena",
    "legends": "Hall of Legends",
    "menu": "Menu"
  },
  "menu": {
    "title": "Menu",
    "profile": "Profile",
    "settings": "Settings",
    "tasks": "Tasks Overview",
    "suggest": "Suggest Task",
    "admin": "Admin"
  },
  "auth": {
    "title": "Welcome to MALLEX",
    "email": "Email",
    "password": "Password",
    "login": "Login",
    "register": "Register",
    "guest": "Continue as Guest"
  }
}
```

### 1.3 Runtime-Guard (optional, aber hilfreich)
**Datei:** `src/i18n/index.ts` (oder wo `i18next` init läuft)

**Aktion:** Hook/Warnung, wenn ein Key kein String ist – verhindert stille Fehler im UI.
```ts
import i18n from 'i18next';

export function safeT(key: string, options?: any): string {
  const v = i18n.t(key, options);
  if (typeof v !== 'string') {
    console.warn(`[i18n] Key "${key}" returned non-string`, v);
    return String(v ?? key);
  }
  return v;
}
```
- Danach sukzessive `t()`-Verwendungen an Hotspots durch `safeT()` ersetzen (z. B. in Menu/Hamburger, TabLabels, Auth-Form).

---

## 2) Auth-Bootstrap: Profil auto-anlegen/-aktualisieren

### 2.1 User-API
**Datei (neu oder erweitern):** `src/lib/userApi.ts`
```ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function ensureUserProfile(uid: string, data: {
  email?: string;
  displayName?: string;
}) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      lastLoginAt: serverTimestamp(),
      // optionally merge other fields you collect at auth time
    }, { merge: true });
  }
  return ref;
}
```

### 2.2 AuthContext erweitern
**Datei:** `src/context/AuthContext.tsx`

**Aktion:** Nach `onAuthStateChanged(user)` – wenn `user` existiert – `ensureUserProfile(user.uid, {...})` **awaiten**. Erst danach den App-Tree rendern (kurzer Loading-State ok).

**Patch (Ausschnitt):**
```ts
import { ensureUserProfile } from '@/lib/userApi';

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    setLoading(true);
    try {
      if (user) {
        await ensureUserProfile(user.uid, {
          email: user.email ?? undefined,
          displayName: user.displayName ?? undefined,
        });
        setAuthState({ user }); // oder dein bestehendes shape
      } else {
        setAuthState({ user: null });
      }
    } finally {
      setLoading(false);
    }
  });
  return () => unsub();
}, []);
```

---

## 3) Admin-Erkennung: Tri-State + Loading

### 3.1 Admin-API
**Datei (neu):** `src/lib/adminApi.ts`
```ts
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function isEmailAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const ref = doc(db, 'admins', email);
  const snap = await getDoc(ref);
  return snap.exists();
}
```

### 3.2 Admin-Status im Context cachen
**Datei:** `src/context/AuthContext.tsx` **oder** eigener `AdminContext`

**Aktion:** Nach erfolgreichem Auth-Login `isEmailAdmin(user.email)` abfragen und im State als `admin: true|false` ablegen. Währenddessen `admin: 'loading'` (tri-state) setzen, damit UI korrekt reagieren kann.

**Patch (Ausschnitt):**
```ts
import { isEmailAdmin } from '@/lib/adminApi';

// innerhalb des onAuthStateChanged handlers, nach ensureUserProfile
let admin = false;
if (user?.email) {
  admin = await isEmailAdmin(user.email);
}
setAuthState({ user, admin }); // oder getrennten AdminContext verwenden
```

**UI:** Admin-geschützte Bereiche erst rendern, wenn `admin !== 'loading'`. Bei `false` ausblenden.

---

## 4) Mini-Abnahme (manuell)

1. **i18n**: Alle Menüpunkte (Arena, Halle der Legenden, Profil, Einstellungen, Aufgaben-Übersicht, Aufgabe vorschlagen, Admin) zeigen Strings – **keine** `menu.title` Roh-Keys mehr.  
2. **Login**: Nach Sign-In existiert/updated `users/{uid}` (siehe Firestore-Console).  
3. **Admin**: Mit deinem Admin-Account erscheint der Admin-Menüpunkt stabil; mit Non-Admin nicht.  
4. **Gast**: Gast sieht Admin nie; Profil-Fallback verhält sich erwartungsgemäß.  

---

## 5) Hinweise

- **Keine** neuen Barrels/`export *`.  
- **Nur** `lib/firebase.ts` darf `app`, `auth`, `db` exportieren.  
- Pfade müssen zu den **bereits gesetzten Regeln** passen.  
- Kein Shell-Run erforderlich; nur Code-Änderungen und Reports.
