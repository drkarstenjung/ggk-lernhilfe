# Anleitung: Eine neue Stunde veröffentlichen

Diese Anleitung ist für Lehrkräfte ohne Programmierkenntnisse. Du brauchst nur einen Browser und ein GitHub-Konto mit Schreibrechten auf das Repository `ggk-lernhilfe`.

## Neue Stunde hochladen

1. Öffne das Repository auf github.com und wechsle in den Ordner **data → lessons**.
2. Klicke oben rechts auf **Add file → Upload files**.
3. Ziehe deine fertige Stundendatei in das Fenster. Der Dateiname muss **genau** so lauten wie die `id` in der Datei plus `.json`, zum Beispiel `11-1.1-wiederholung-18-jh.json`.
4. Klicke unten auf **Commit changes** (der Standardtext ist in Ordnung).

## Warten und prüfen

1. Öffne den Reiter **Actions**. Dort erscheint ein neuer Eintrag mit einem gelben Punkt.
2. Warte etwa 1 bis 2 Minuten, bis dort ein **grüner Haken** steht.
3. Öffne die App. Wenn du sie schon geöffnet hattest, erscheint oben das Banner **„Neue Fragen verfügbar. Jetzt aktualisieren“**. Tippe darauf. Die neue Stunde steht danach in der Liste.

## Roter Kreis oder rotes Kreuz

Dann ist etwas an der Datei nicht in Ordnung, und **die App bleibt unverändert** (es geht nichts kaputt).

1. Klicke auf den roten Eintrag, dann auf **deploy** und auf den Schritt **Stundendateien validieren**.
2. Lies die Fehlermeldung. Sie nennt die Datei, die Frage-ID und was zu ändern ist, zum Beispiel: „Es sind 9 Fragen vorhanden, es müssen genau 10 sein.“
3. Korrigiere die Datei und lade sie erneut hoch (gleicher Dateiname, siehe unten). Warte wieder auf den grünen Haken.

Meldungen mit „WARNUNG“ stoppen nichts. Sie sind Hinweise, zum Beispiel dass die richtige Antwort zu oft die längste ist.

## Eine bestehende Stunde korrigieren

Lade die korrigierte Datei **mit demselben Namen** hoch. GitHub fragt beim Hochladen nicht nach, sondern ersetzt die alte Datei. Alternativ: Datei in `data/lessons` öffnen, auf das Stift-Symbol klicken, ändern und **Commit changes** wählen.

Fragetexte, Antworten und Erklärungen dürfen jederzeit korrigiert werden, der Lernfortschritt der Schüler bleibt erhalten.

## Eine Stunde entfernen

Datei in `data/lessons` öffnen, oben rechts auf die drei Punkte, **Delete file**, **Commit changes**. Der Lernfortschritt zu den entfernten Fragen verschwindet bei den Schülern beim nächsten Start der App.

## Wichtig: IDs niemals ändern

Der Lernstand der Schüler hängt an den IDs (`id` der Stunde, `id` jeder Frage und jeder Kompetenz). Wer eine ID ändert, setzt den Fortschritt zu dieser Frage zurück. IDs bestehen nur aus `a-z`, `0-9`, Punkt und Bindestrich, und jede Frage-ID beginnt mit der Stunden-ID.

## Dateien, die mit „_“ beginnen

Dateien wie `_beispiel.json` sind Vorlagen und werden in der App nicht angezeigt. Zum Üben kopiere `_beispiel.json`, benenne sie um (ohne `_`, Name = neue `id`) und passe alles an, einschließlich der `id` in der Datei und aller Frage- und Kompetenz-IDs.
