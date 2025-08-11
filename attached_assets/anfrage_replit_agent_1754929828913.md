
# Anfrage an den Replit-Agenten zur Analyse

Hallo Agent,

ich möchte, dass du meine aktuelle App-Analyse durchführst und mir gezielt Feedback zu meinen Fragen gibst.

## Ziel
Ich möchte herausfinden, warum die App aktuell immer wieder neu startet und ggf. im HMR-Loop hängen bleibt.

## Vorgehensweise
1. **Debug-Logs auswerten**
   - Prüfe bitte die aktuelle Konsolen-Log-Ausgabe im Browser.
   - Achte besonders auf Fehler in Zusammenhang mit Firebase und Umgebungsvariablen (Secrets).

2. **Fragen an dich**
   - Welche Umgebungsvariablen fehlen oder sind falsch?
   - Wird Firebase korrekt initialisiert?
   - Gibt es Anzeichen, dass der AuthContext falsche oder leere Daten erhält?
   - Liegt das Problem an einer fehlerhaften Verbindung zu Firebase oder an einem internen Fehler in der App?
   - Falls Firebase offline ist, sollte die App im Gastmodus starten – passiert das aktuell?

3. **Ergebnis**
   - Bitte beantworte jede Frage einzeln und klar.
   - Falls du Änderungen vorschlägst, erläutere bitte auch kurz den Grund.
   - Wenn möglich, gib eine Reihenfolge der Dringlichkeit für die Behebung der Probleme an.

---

Danke, dass du die Analyse für mich übernimmst.
