# GGK-Lernhilfe

Lern-App (PWA) für Schüler eines Beruflichen Gymnasiums in Baden-Württemberg, Fach Geschichte mit Gemeinschaftskunde (Klassen 11 bis 13). Kein Backend, kein Framework, keine Laufzeit-Abhängigkeiten, keine externen Requests. Der Lernstand liegt nur im `localStorage` des Geräts.

**App:** https://drkarstenjung.github.io/ggk-lernhilfe/ (nach dem ersten Deployment)

## Funktionen

- **Quiz:** 10 Multiple-Choice-Fragen zu einer Stunde oder (mit Haken „Ganze BPE“) 10 geschichtete Fragen aus einer ganzen BPE.
- **Lernmodus:** adaptiver Lernkasten (5 Kästen). Eine Runde = 10 zufällig, nach Kasten gewichtet gezogene Fragen aus beliebig vielen gewählten Stunden.
- **Kompetenzcheck:** Selbsteinschätzung (Skala 1 bis 4), Lernhinweise, Kompetenzprofil als Ampel, Soll-Ist-Vergleich mit dem Quiz.
- **Lesetexte** (mit Sprung aus Quiz, Lernmodus und Kompetenzcheck), **Lernstand** (Export, Import, Zurücksetzen), **Info** (Datenschutz, Impressum-Platzhalter).

## Lokale Entwicklung

Voraussetzung: Node 20 oder neuer.

```bash
npm install            # nur für das Icon-Rendering nötig (devDependency)
npm test               # Tests (node:test)
npm run validate       # Stundendateien prüfen
npm run build:dev      # baut nach dist/ inklusive Beispiel- und Testdateien (Namen mit „_“)
npm run serve          # statischer Server auf http://localhost:8080/
```

`npm run build` baut ohne die `_`-Dateien (so läuft es im Deployment). Beim Ändern der App lokal im Browser kann der Service Worker die alte Version ausliefern: in den Entwicklertools unter „Application“ den Service Worker abmelden oder das Banner „Jetzt aktualisieren“ antippen.

Icons neu rendern (nach Änderung an `app/icons/icon.svg`): `npm run icons`. Die PNGs liegen im Repository, die CI rendert nichts.

## Deployment (GitHub Pages)

Einmalig: im Repository **Settings → Pages → Source = „GitHub Actions“** wählen. Danach veröffentlicht jeder Push auf `main` automatisch (Tests, Validierung, Build, Deploy; siehe `.github/workflows/deploy.yml`). Bei Validierungsfehlern wird nicht veröffentlicht.

## Aufbau

```
app/                      index.html, css, js (ES-Module), sw.js, manifest.webmanifest, icons/
data/bpe.json             Liste der BPE
data/lernhinweise.json    allgemeine Lernhinweise je Stufe und Zusatz je Kompetenztyp
data/lessons/*.json       eine Datei je Stunde (Namen mit „_“ = Beispiel/Test, nicht sichtbar)
scripts/                  validate, build, serve, Icon-Rendering
tests/                    Tests
docs/                     ANLEITUNG-UPDATE.md, FRAGENRICHTLINIEN.md
```

`data/manifest.json` wird vom Build erzeugt (Stundenliste, Inhalts-Hash als `version`). Der Hash steckt auch im Cache-Namen des Service Workers.

Neue Stunden einstellen: siehe [docs/ANLEITUNG-UPDATE.md](docs/ANLEITUNG-UPDATE.md). Fragen schreiben: [docs/FRAGENRICHTLINIEN.md](docs/FRAGENRICHTLINIEN.md).
