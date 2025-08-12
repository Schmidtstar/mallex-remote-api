# MALLEX – Optimale Vorgaben für UI-Texte & i18n

## 1) Namens- & Strukturregeln (Pflicht)
- **Keys**: `bereich.unterbereich.bezeichnung` (nur **lowercase**, **keine** Leerzeichen, **.** als Trenner).
- **Bereiche** (Top‑Level): `common`, `nav`, `menu`, `arena`, `legends`, `tasks`, `auth`, `profile`, `admin`, `errors`.
- **Texte**:
  - Titel/Kopfzeilen: kurze Substantiv-Phrasen, keine Punkte am Ende.
  - Buttons: **Imperativ** („Anmelden“, „Neue Aufgabe“).
  - Platzhalter: knapp, aussagekräftig („Name des Helden“).
- **Keine Duplikate** (ein Key = eine Bedeutung).
- **Englisch parallel pflegen** (jede DE‑Ergänzung sofort auch EN).
- **Fallback**: Fehlende Keys niemals im UI anzeigen, sondern sicheren Fallback-Text nutzen.

---

## 2) Kanon der benötigten Keys (Minimal‑Set v1)

### DE (de.json)
```json
{
  "nav": {
    "arena": "Arena",
    "legends": "Legenden",
    "menu": "Menü",
    "tasks": "Aufgaben",
    "suggestTask": "Aufgabe vorschlagen"
  },
  "menu": {
    "title": "Menü",
    "sections": {
      "game": "Spiel",
      "tasks": "Aufgaben",
      "account": "Konto"
    },
    "settings": "Einstellungen",
    "profile": "Profil",
    "logout": "Abmelden"
  },
  "auth": {
    "loginTitle": "Anmelden",
    "email": "E-Mail",
    "password": "Passwort",
    "loginButton": "Anmelden",
    "registerLink": "Konto erstellen",
    "guestButton": "Als Gast fortfahren",
    "errors": {
      "invalid": "Ungültige Anmeldedaten."
    }
  },
  "arena": {
    "title": "MALLEX Arena",
    "selectCategory": "Wähle eine Kategorie",
    "selectPlayer": "Wähle 'Neue Aufgabe' um zu beginnen",
    "newTask": "Neue Aufgabe",
    "categories": {
      "fate": "Schicksal",
      "shame": "Schande",
      "seduction": "Verführung",
      "escalation": "Eskalation",
      "confession": "Geständnis"
    }
  },
  "legends": {
    "title": "Halle der Legenden",
    "playersList": "Spieler werden in deinem Profil gespeichert.",
    "addPlaceholder": "Name des Helden",
    "addButton": "Beschwöre die Götter"
  },
  "tasks": {
    "title": "Aufgaben",
    "overview": "Aufgaben-Übersicht",
    "suggest": {
      "title": "Aufgabe vorschlagen",
      "placeholder": "Deine Aufgabe…",
      "submit": "Senden"
    },
    "admin": {
      "title": "Aufgabenverwaltung",
      "approve": "Annehmen",
      "reject": "Ablehnen"
    }
  },
  "profile": {
    "title": "Profil",
    "displayName": "Anzeigename",
    "birthdate": "Geburtsdatum",
    "gender": "Geschlecht",
    "nationality": "Nationalität",
    "save": "Speichern",
    "ageYears": "{{count}} Jahre"
  },
  "common": {
    "loading": "Laden…",
    "error": "Fehler",
    "cancel": "Abbrechen",
    "ok": "OK"
  }
}
```

---

### EN (en.json)
```json
{
  "nav": {
    "arena": "Arena",
    "legends": "Legends",
    "menu": "Menu",
    "tasks": "Tasks",
    "suggestTask": "Suggest task"
  },
  "menu": {
    "title": "Menu",
    "sections": {
      "game": "Game",
      "tasks": "Tasks",
      "account": "Account"
    },
    "settings": "Settings",
    "profile": "Profile",
    "logout": "Log out"
  },
  "auth": {
    "loginTitle": "Sign in",
    "email": "Email",
    "password": "Password",
    "loginButton": "Sign in",
    "registerLink": "Create account",
    "guestButton": "Continue as guest",
    "errors": {
      "invalid": "Invalid credentials."
    }
  },
  "arena": {
    "title": "MALLEX Arena",
    "selectCategory": "Choose a category",
    "selectPlayer": "Choose 'New task' to start",
    "newTask": "New task",
    "categories": {
      "fate": "Fate",
      "shame": "Shame",
      "seduction": "Seduction",
      "escalation": "Escalation",
      "confession": "Confession"
    }
  },
  "legends": {
    "title": "Hall of Legends",
    "playersList": "Players are saved in your profile.",
    "addPlaceholder": "Name of the hero",
    "addButton": "Summon the gods"
  },
  "tasks": {
    "title": "Tasks",
    "overview": "Tasks overview",
    "suggest": {
      "title": "Suggest a task",
      "placeholder": "Your task…",
      "submit": "Submit"
    },
    "admin": {
      "title": "Task admin",
      "approve": "Approve",
      "reject": "Reject"
    }
  },
  "profile": {
    "title": "Profile",
    "displayName": "Display name",
    "birthdate": "Date of birth",
    "gender": "Gender",
    "nationality": "Nationality",
    "save": "Save",
    "ageYears": "{{count}} years"
  },
  "common": {
    "loading": "Loading…",
    "error": "Error",
    "cancel": "Cancel",
    "ok": "OK"
  }
}
```

---

## 3) Code-Vorgaben
- Immer `t('key')` statt statischer Strings.
- `safeT` nutzen, um fehlende Keys abzufangen.
- Fallback-Logging im Dev-Mode aktiv.

## 4) QA-Checkliste
- Prüfen, ob **kein Key-Name** im UI erscheint.
- Alle Screens in DE/EN durchtesten.
- Änderungen **gleichzeitig** in beiden Sprachdateien pflegen.
