# Richtlinien für die Erstellung der Fragen

Diese Richtlinien gelten für Menschen und für KI-Assistenten, die Stundendateien (`data/lessons/*.json`, Vorlage: `data/lessons/_beispiel.json`) erstellen.

## Grundsätze

- **Nur aus dem Lesetext belegbar.** Jede Frage und jede richtige Antwort muss sich aus dem Lesetext der Stunde ergeben. Nichts erfinden, kein Wissen von außen. `lesetext_ref` verweist auf den Abschnitt, in dem die Antwort steht.
- **Schwerpunkt AFB I** (Reproduktion): Fakten, Begriffe, Daten, Personen, Zuordnungen, einfache Zusammenhänge.
- **Leicht** (genau 3 je Stunde): direkte Reproduktion, klar unterscheidbare Antworten.
- **Anspruchsvoller** (genau 7 je Stunde): plausiblere falsche Antworten und Zusammenhangswissen (zum Beispiel Ursache und Folge, Zuordnung mehrerer Elemente). Aber kein Urteilen und keine Quellenanalyse.
- **Kern** (genau 8): betrifft die Leitfrage der Stunde. **Neben** (genau 2): Details.

## Aufbau jeder Frage

- Genau **4** Antworten, genau **eine** eindeutig richtige. Die Position der richtigen Antwort darf beliebig sein (die App mischt ohnehin bei jedem Durchgang).
- Falsche Antworten (Distraktoren) sind **plausibel**, **ähnlich lang** und **grammatisch passend** zur Frage. Die richtige Antwort ist nicht auffällig länger oder genauer. (Der Validator warnt, wenn sie in mehr als 5 von 10 Fragen die längste ist.)
- **Keine Verneinungen** in der Frage („Welche Aussage ist nicht richtig?“).
- **Keine** Antworten wie „alle genannten“, „keine der genannten“, „alle Antworten“. Der Validator weist sie als Fehler ab.
- Alle 4 Antworten sind verschieden. Fragetexte kommen in keiner Datei doppelt vor.
- Die **Erklärung** besteht aus ein bis zwei Sätzen: warum die richtige Antwort stimmt. Sie erscheint nach der Antwort.

## Kompetenzen (3 bis 4 je Stunde)

- `kann_aussage` im Ich-Format („Ich kann …“), überprüfbar und konkret.
- `typ`: `sachwissen` (trainiert die App direkt), `quellenarbeit`, `urteilen` oder `methode` (werden vor allem im Unterricht geübt).
- `lernhinweise` für alle vier Stufen (1 = sehr sicher bis 4 = unsicher): kurz, konkret, in du-Form, bezogen auf diese Stunde.

## Sprache

Deutsch, Anrede „du“, kein Gendern, keine Emojis. Sachlich und neutral. Bei kontroversen Themen keine Wertungen vorgeben (Beutelsbacher Konsens).

## Formales

- `id`: nur `a-z`, `0-9`, `.`, `-`. Dateiname = `<id>.json`. Frage-IDs `<stunden-id>-q01` bis `-q10`, Kompetenz-IDs `<stunden-id>-k1` …
- IDs sind **dauerhaft stabil** und dürfen nach der Veröffentlichung nie geändert werden.
- `bpe` und `jahrgang` müssen zu `data/bpe.json` passen.
- Prüfen mit `npm run validate`, bei GitHub passiert das automatisch vor jeder Veröffentlichung.
