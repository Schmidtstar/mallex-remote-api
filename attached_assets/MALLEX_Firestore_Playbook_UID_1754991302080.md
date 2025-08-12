# MALLEX – Firestore Rules (Variante B, UID-basiert) – Test-Playbook

Ziel: Verifizieren, dass die neuen Regeln funktionieren (Admin = `admins/{uid}`), Kategorien konsistent sind und Nicht-Admins keinen Zugriff auf Admin-Funktionen haben.

## 1) Vorbereitung
- In Firestore **Collection** `admins` anlegen.
- Für deinen Admin-Account die **Dokument-ID = UID** des Nutzers verwenden (nicht die E‑Mail!).
  - UID findest du in Firebase Console > Authentication > Users.
- In der App sicherstellen:
  - Kategorien sind **genau**: `fate`, `shame`, `seduction`, `escalation`, `confession`.
  - Client schreibt `suggestions/*` mit `createdBy = auth.uid`.

## 2) Positiv-Tests (Admin)
1. Als Admin einloggen (UID ist in `admins/{uid}` vorhanden).
2. **Suggestions**:
   - Neuen Vorschlag erstellen → erlaubt.
   - Liste aller Vorschläge sehen → erlaubt.
   - Vorschlag **approve/reject** → erlaubt (update/delete).
3. **Tasks**:
   - Neuen Task erstellen → erlaubt.
   - Task bearbeiten/löschen → erlaubt.
4. **Users**:
   - Eigenes Profil lesen/ändern → erlaubt.
   - Fremdes Profil aufrufen → **verboten**.

## 3) Negativ-Tests (Nicht-Admin, aber eingeloggt)
1. Vorschläge:
   - Eigenen Vorschlag erstellen → erlaubt.
   - Alle Vorschläge listen → **verboten** (nur eigene).
   - Update/Delete eines fremden Vorschlags → **verboten**.
2. Tasks:
   - Task erstellen/bearbeiten/löschen → **verboten**.
   - Lesen → erlaubt.
3. Users:
   - Nur eigenes Profil lesen/ändern → erlaubt; fremde → **verboten**.

## 4) Unauthentifizierter Nutzer
- **Alles verboten** (außer ggf. öffentliche Inhalte, die wir nicht definiert haben).

## 5) Deployment-Hinweise
- Datei speichern als `firestore.rules` im Projekt-Root.
- Deploy mit Firebase CLI:
  ```bash
  firebase deploy --only firestore:rules
  ```
- Alternativ im Console-UI die Regeln einfügen und veröffentlichen.

## 6) Troubleshooting
- 403 bei Admin-Aktionen → Prüfe:
  - Ist deine UID **exakt** als Dokument-ID in `admins/{uid}` angelegt?
  - Bist du eingeloggt? (auth.uid vorhanden)
  - Kategorien stimmen exakt?
- Non-Admin sieht alle Suggestions → Prüfe die **read**-Bedingung in `/suggestions/{sid}` (sie muss `admin() || (signedIn() && resource.data.createdBy == request.auth.uid)` sein).
