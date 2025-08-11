# Agent-Vorgabe: Login-Screen reparieren & polieren

## Ziel
Den Login-Bereich wieder **sauber, übersetzt und mobilfreundlich** darstellen – inklusive semantischem Markup, einheitlichem Layout/Styling, sauberer Fehleranzeige und vollständiger i18n-Unterstützung.

---

## Betroffene Dateien
- `src/features/Auth/AuthScreen.tsx`
- `src/i18n/de.json`
- `src/i18n/en.json`
- `src/styles/index.css` **oder** `src/features/Auth/AuthScreen.module.css` (je nach Projektstruktur)
- Optional: `src/styles/tokens.css` (Farben/Abstände konsolidieren)

---

## 1) i18n-Einträge ergänzen/prüfen

### `src/i18n/de.json`
```json
{
  "auth": {
    "loginTitle": "Anmelden",
    "email": "E-Mail",
    "password": "Passwort",
    "login": "Anmelden",
    "registerLink": "Schon ein Konto? Einloggen",
    "guestButton": "Als Gast fortfahren",
    "loggingIn": "Anmeldung läuft…",
    "error": "Anmeldung fehlgeschlagen",
    "invalidCredentials": "E-Mail oder Passwort ist falsch.",
    "required": "Pflichtfeld",
    "emailInvalid": "Bitte eine gültige E-Mail eingeben."
  }
}
```

### `src/i18n/en.json`
```json
{
  "auth": {
    "loginTitle": "Sign in",
    "email": "Email",
    "password": "Password",
    "login": "Sign in",
    "registerLink": "Already have an account? Log in",
    "guestButton": "Continue as guest",
    "loggingIn": "Signing in…",
    "error": "Sign-in failed",
    "invalidCredentials": "Email or password is incorrect.",
    "required": "Required",
    "emailInvalid": "Please enter a valid email."
  }
}
```

> **Wichtig:** Im UI **nie** die Keys anzeigen – immer via `t('auth.loginTitle')` usw. rendern.

---

## 2) `AuthScreen.tsx` überarbeiten (Semantik & Logik)

**To‑Dos**  
- `<form onSubmit={handleSubmit}>` verwenden
- Labels mit `htmlFor` und zugehörigen `id`s setzen
- Inputs: `type="email"`, `inputMode="email"`, `autoComplete="email"`; sowie `type="password"`, `autoComplete="current-password"`
- Primär-Button „Anmelden“, Links/Buttons „Einloggen/Registrieren“ & „Als Gast fortfahren“
- Enter-Key triggert Submit
- Lade- und Fehlerzustände anzeigen

**Beispiel (Auszug)**
```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// importiere ggf. deine Auth-API / Context
// import { signInWithEmail } from '@/lib/userApi';

export default function AuthScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // await signInWithEmail(email, password);
      // navigate('/arena'); // ggf. Router verwenden
    } catch (err: any) {
      // mapping von Firebase-Fehlern auf i18n
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" role="region" aria-label={t('auth.loginTitle')}>
        <h1 className="auth-title">{t('auth.loginTitle')}</h1>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="field">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <div className="auth-actions">
          <button className="btn btn-ghost" type="button">
            {t('auth.registerLink')}
          </button>
          <button className="btn btn-ghost" type="button">
            {t('auth.guestButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 3) CSS / Styling (kompakt, mobilfreundlich)

> Entweder in `src/styles/index.css` oder modular in `AuthScreen.module.css` verwenden.

```css
/* Layout */
.auth-wrap {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.auth-title {
  margin: 0 0 16px;
  font-size: 1.5rem;
  font-weight: 700;
}

.auth-form {
  display: grid;
  gap: 12px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.95rem;
}

.field input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  font-size: 16px; /* iOS Zoom vermeiden */
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(0,0,0,0.35);
  color: inherit;
}

.field input:focus {
  outline: 2px solid rgba(100, 180, 255, 0.9);
  outline-offset: 2px;
  border-color: transparent;
}

.auth-error {
  margin: 4px 0 0;
  color: #ff6b6b;
  font-size: 0.9rem;
}

.btn {
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary {
  width: 100%;
  background: #4aa3ff;
  color: #051320;
  font-weight: 700;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-ghost {
  width: 100%;
  background: transparent;
  border-color: rgba(255,255,255,0.15);
  color: inherit;
}

.auth-actions {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
```

---

## 4) Fehlerbehandlung (Firebase → i18n)

- Mapping typischer Codes (`auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password`) auf nutzerfreundliche Texte (`t('auth.invalidCredentials')`).  
- Fehler **nicht** als Alert, sondern inline unter dem Feld/über dem Button anzeigen.  
- Ladezustand (`loading`) sperrt den Submit-Button.

---

## 5) Checkliste (Abnahme)
- [ ] Keine Roh-Keys sichtbar (`auth.loginTitle` etc.)  
- [ ] Form ist per Enter submitbar, Buttons sind 44px hoch  
- [ ] Inputs mit passenden `type`, `autoComplete`, `inputMode`  
- [ ] Eindeutige, übersetzte Fehlermeldungen  
- [ ] Sauberes, zentriertes Layout; Dark-Mode gut lesbar  
- [ ] HMR ohne Konsole-Fehler

---

## 6) Optional (Nice-to-have)
- Passwortanzeige-Toggle (👁️)  
- „Als Gast fortfahren“ direkt mit Guest-Auth verknüpfen  
- Link zum Registrieren/Login sauber verbinden (Router-Navigation)  
- Rate-Limiting/Throttle bei wiederholten Fehlversuchen

---

**Hinweis:** Falls der Screen zusätzlich Geburtsdatum/Geschlecht/Nationalität anzeigen/bearbeiten soll, verweise auf die separate „Profil-Erweiterung“-Vorgabe und re-use die dort beschriebenen Komponenten/Validierung.
