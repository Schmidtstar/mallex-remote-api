# MALLEX – Sprint D (Profil-Felder + Edit-Flow)
_Ziel: Registrierungs- und Profilverwaltung erweitern um **Geburtsdatum**, **Geschlecht**, **Nationalität**. Speicherung in `users/{uid}` (Firestore), Anzeige & Bearbeitung im Profil. Nur Code/Dateien ändern, keine Shell-Kommandos._

---

## 0) Leitplanken
- **Datenschema (Firestore `users/{uid}`):**
  - `birthDate`: **ISO** `YYYY-MM-DD` (z. B. `"1985-01-01"`)
  - `gender`: `"male" | "female" | "diverse"`
  - `nationality`: **ISO-3166-1 alpha-2** (z. B. `"DE"`, `"US"`)
- **UI-Eingabe:** Geburtsdatum **TT.MM.JJJJ**; App konvertiert zwischen Anzeige (TT.MM.JJJJ) und Speicherung (YYYY-MM-DD).
- Anzeige im Profil: `Geburtsdatum (Alter)` – Alter wird clientseitig berechnet.

---

## 1) i18n-Schlüssel ergänzen
**Dateien:** `src/i18n/de.json`, `src/i18n/en.json`  
**Aktion:** Folgende Keys ergänzen (Bezeichnungen ggf. zu eurem Stil mappen):

```jsonc
// de.json (Ausschnitt)
{
  "profile": {
    "title": "Profil",
    "birthDate": "Geburtsdatum",
    "birthDate_placeholder": "TT.MM.JJJJ",
    "gender": "Geschlecht",
    "gender_male": "Männlich",
    "gender_female": "Weiblich",
    "gender_diverse": "Divers",
    "nationality": "Nationalität",
    "save": "Speichern",
    "saved": "Gespeichert",
    "cancel": "Abbrechen",
    "edit": "Bearbeiten",
    "ageYears": "{{count}} Jahre"
  },
  "auth": {
    "additionalInfo": "Zusätzliche Angaben (optional)"
  },
  "countries": {
    "DE": "Deutschland",
    "AT": "Österreich",
    "CH": "Schweiz",
    "US": "Vereinigte Staaten",
    "GB": "Vereinigtes Königreich",
    "FR": "Frankreich",
    "ES": "Spanien",
    "IT": "Italien",
    "TR": "Türkei"
  }
}
```

```jsonc
// en.json (Ausschnitt)
{
  "profile": {
    "title": "Profile",
    "birthDate": "Date of Birth",
    "birthDate_placeholder": "DD.MM.YYYY",
    "gender": "Gender",
    "gender_male": "Male",
    "gender_female": "Female",
    "gender_diverse": "Diverse",
    "nationality": "Nationality",
    "save": "Save",
    "saved": "Saved",
    "cancel": "Cancel",
    "edit": "Edit",
    "ageYears": "{{count}} years"
  },
  "auth": {
    "additionalInfo": "Additional info (optional)"
  },
  "countries": {
    "DE": "Germany",
    "AT": "Austria",
    "CH": "Switzerland",
    "US": "United States",
    "GB": "United Kingdom",
    "FR": "France",
    "ES": "Spain",
    "IT": "Italy",
    "TR": "Türkiye"
  }
}
```

---

## 2) Hilfsfunktionen für Datum & Auswahl
**Datei (neu):** `src/lib/date.ts`
```ts
export function parseDobInputToISO(input: string): string | null {
  // erwartet "TT.MM.JJJJ"
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  // naive Prüfung; optional echte Date-Validation ergänzen
  return `${yyyy}-${mm}-${dd}`; // ISO
}

export function formatISOToDob(iso?: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const [_, yyyy, mm, dd] = m;
  return `${dd}.${mm}.${yyyy}`;
}

export function calcAgeFromISO(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}
```

**Datei (neu):** `src/lib/options.ts`
```ts
export const genderOptions = [
  { value: 'male', labelKey: 'profile.gender_male' },
  { value: 'female', labelKey: 'profile.gender_female' },
  { value: 'diverse', labelKey: 'profile.gender_diverse' },
] as const;

export const nationalityOptions = [
  'DE','AT','CH','US','GB','FR','ES','IT','TR'
] as const;
```

---

## 3) User-API erweitern
**Datei:** `src/lib/userApi.ts` (erweitern)

```ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

export async function ensureUserProfile(uid: string, data: {
  email?: string;
  displayName?: string;
  birthDate?: string | null;    // ISO YYYY-MM-DD
  gender?: 'male'|'female'|'diverse'|null;
  nationality?: string | null;  // ISO country code
}) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      birthDate: data.birthDate ?? null,
      gender: data.gender ?? null,
      nationality: data.nationality ?? null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      lastLoginAt: serverTimestamp(),
      // merge optional Felder nur wenn übergeben
      ...(data.birthDate !== undefined ? { birthDate: data.birthDate } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.nationality !== undefined ? { nationality: data.nationality } : {}),
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
    }, { merge: true });
  }
  return ref;
}

export async function updateUserProfile(uid: string, patch: {
  birthDate?: string | null;
  gender?: 'male'|'female'|'diverse'|null;
  nationality?: string | null;
  displayName?: string | null;
}) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    ...patch
  });
  return ref;
}
```

> **Hinweis:** `ensureUserProfile` wird weiterhin im `onAuthStateChanged`-Flow aufgerufen (siehe Sprint A).

---

## 4) Registrierung erweitern (optional, non-blocking)
**Datei:** `src/features/Auth/AuthScreen.tsx`  
**Aktion:** Im Registrier-Mode die drei optionalen Felder anzeigen und bei erfolgreichem SignUp an `ensureUserProfile` übergeben (konvertiert).

**Ausschnitt (Pseudo):**
```tsx
const [dobInput, setDobInput] = useState('');
const [gender, setGender] = useState<'male'|'female'|'diverse'|''>('');
const [nationality, setNationality] = useState<string>('');

// nach createUserWithEmailAndPassword:
await ensureUserProfile(user.uid, {
  email: user.email ?? undefined,
  displayName: user.displayName ?? undefined,
  birthDate: parseDobInputToISO(dobInput) ?? null,
  gender: gender || null,
  nationality: nationality || null,
});
```

UI:  
- Geburtsdatum: `<input placeholder={t('profile.birthDate_placeholder')}>`  
- Geschlecht: 3er-Button-Group / Radio  
- Nationalität: `<select>` mit `nationalityOptions` und Labels `t('countries.DE')` etc.

---

## 5) Profilbildschirm – Anzeigen & Bearbeiten
**Datei:** `src/features/Menu/ProfileScreen.tsx` (oder euren Profil-Screen)

**Ziele:**
- Anzeige: Email, Anzeige-Name, Geburtsdatum (TT.MM.JJJJ) **+ Alter**, Geschlecht, Nationalität.
- „Bearbeiten“-Button → Edit-Mode: Felder bearbeitbar, „Speichern“ → `updateUserProfile`.
- Validierung:
  - Geburtsdatum: akzeptiere nur gültiges `TT.MM.JJJJ` → konvertiere nach ISO oder speichere `null`.
  - Geschlecht nur aus den 3 erlaubten Werten.
  - Nationalität nur aus definierter Liste.

**Ausschnitt (Pseudo):**
```tsx
const age = calcAgeFromISO(profile.birthDate);
const dobDisplay = formatISOToDob(profile.birthDate);
...
{dobDisplay && <div>{dobDisplay}{age != null ? ` (${t('profile.ageYears', { count: age })})` : ''}</div>}
```

---

## 6) Firestore-Regeln – Kompatibilität
Die aktuellen Regeln erlauben `read/create/update` **nur** am eigenen `users/{uid}`-Dokument. Das passt.  
> Wenn ihr Feld-Whitelisting erzwingen wollt, könnt ihr später das Schema in den Regeln ergänzen (siehe frühere Vorschläge). Für Sprint D nicht zwingend.

---

## 7) Akzeptanzkriterien (Abnahme)

- [ ] i18n-Keys vorhanden (de/en) für Felder & Labels.  
- [ ] Registrierung: optionale Zusatzfelder sichtbar; nach SignUp werden sie gemerged.  
- [ ] Profil: Anzeige von Geburtsdatum (TT.MM.JJJJ) und **Alter**; Edit-Mode speichert Änderungen.  
- [ ] Firestore: `users/{uid}` enthält/updated `birthDate` (ISO), `gender`, `nationality`.  
- [ ] Validierungen greifen (falsches Datum wird nicht gespeichert oder zurückgewiesen).  
- [ ] Keine neuen Barrel-Exports; nur zentrale Firebase-Exporte.

---

## 8) Reporting
Bitte nach Umsetzung kurz berichten:
- Geänderte Dateien
- Welche UI-Stellen hinzugefügt/angepasst wurden
- Ein Testlauf (SignUp/SignIn, Profil anzeigen, Profil editieren)
