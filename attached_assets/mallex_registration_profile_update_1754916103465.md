# MALLEX Projekt – Registrierung & Profil Erweiterung

## Ziel
Die Registrierung und das Profil sollen um zusätzliche Felder erweitert werden. Diese Daten werden in Firebase gespeichert, im Profil angezeigt und können später im Profil (Einstellungen) bearbeitet werden.

---

## Neue Felder bei Registrierung
1. **Geburtsdatum**
   - Eingabeformat: `TT.MM.JJJJ`
   - Beispielplatzhalter: `01.01.1985`
   - Keine Mindestalter-Beschränkung
   - Anzeige im Profil: Geburtsdatum + automatisch berechnetes Alter
   - Validierung: Muss korrektes Datum sein

2. **Geschlecht**
   - Auswahl über Button-Gruppe:
     - Männlich
     - Weiblich
     - Divers

3. **Nationalität**
   - Dropdown-Auswahl (z. B. Deutsch, Englisch, United States, …)

---

## Änderungen im Code

### 1. **i18n (de.json / en.json)**
Neue Keys hinzufügen:
```json
"profile.birthdate": "Geburtsdatum",
"profile.gender": "Geschlecht",
"profile.gender.male": "Männlich",
"profile.gender.female": "Weiblich",
"profile.gender.diverse": "Divers",
"profile.nationality": "Nationalität",
"profile.age": "Alter"
```

---

### 2. **Utils** (`src/utils/dateUtils.ts`)
Funktion für Altersermittlung:
```ts
export function calculateAge(dateString: string): number {
  const [day, month, year] = dateString.split('.').map(Number);
  const birthDate = new Date(year, month - 1, day);
  const diffMs = Date.now() - birthDate.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}
```

---

### 3. **Firebase API** (`src/api/user.ts`)
Erweiterung von `createUserProfile` und `updateUserProfile` um neue Felder:
```ts
export async function createUserProfile(uid: string, data: any) {
  return setDoc(doc(db, "users", uid), {
    ...data,
    birthdate: data.birthdate || null,
    gender: data.gender || null,
    nationality: data.nationality || null
  });
}
```

---

### 4. **Registrierungsformular** (`src/features/auth/RegisterScreen.tsx`)
Neue Eingabefelder einbauen:
- Textfeld für Geburtsdatum
- Button-Group für Geschlecht
- Dropdown für Nationalität

---

### 5. **Profilanzeige & Bearbeiten** (`src/features/profile/ProfileScreen.tsx`)
- Geburtsdatum + Alter anzeigen: `01.01.1985 (Alter: 39)`
- Geschlecht anzeigen
- Nationalität anzeigen
- "Bearbeiten"-Button einfügen → öffnet Formular mit denselben Feldern wie bei Registrierung, Änderungen werden in Firebase gespeichert

---

### 6. **Firebase Security Rules**
Sicherstellen, dass Nutzer nur ihr eigenes Profil lesen/schreiben dürfen:
```txt
match /users/{userId} {
  allow read, update: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
}
```

---

## Akzeptanzkriterien
- [ ] Neue Felder erscheinen im Registrierungsformular
- [ ] Felder werden in Firestore gespeichert
- [ ] Profil zeigt neue Felder korrekt an
- [ ] Alter wird automatisch berechnet
- [ ] Profilbearbeitung aktualisiert Firebase-Daten
- [ ] i18n für alle Texte vorhanden
- [ ] Security Rules verhindern Fremdzugriff

