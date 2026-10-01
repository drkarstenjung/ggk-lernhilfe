import test from "node:test";
import assert from "node:assert/strict";
import { pruefe } from "../scripts/validate-lib.mjs";
import { baueStunde } from "./helpers.mjs";
import { readFileSync } from "node:fs";

const lies = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url), "utf8"));
const bpe = lies("bpe.json");
const lernhinweise = lies("lernhinweise.json");

const lauf = (daten, datei = "11-1.1-test.json") => pruefe({ bpe, lernhinweise, dateien: [{ datei, daten }] });
const gueltig = () => baueStunde({ id: "11-1.1-test" });
const fehlerEnthaelt = (erg, re) => assert.ok(erg.fehler.some((f) => re.test(f)), `Erwartet ${re}, erhalten:\n${erg.fehler.join("\n")}`);

test("gültige Datei: keine Fehler, keine Warnungen", () => {
  const erg = lauf(gueltig());
  assert.deepEqual(erg.fehler, []);
  assert.deepEqual(erg.warnungen, []);
});

test("Beispieldatei im Repository ist gültig", () => {
  const erg = lauf(lies("lessons/_beispiel.json"), "_beispiel.json");
  assert.deepEqual(erg.fehler, []);
});

test("Pflichtfeld fehlt", () => { const d = gueltig(); delete d.kurztitel; fehlerEnthaelt(lauf(d), /kurztitel/); });
test("ungültiges JSON", () => { const erg = pruefe({ bpe, lernhinweise, dateien: [{ datei: "x.json", daten: null, parseFehler: "Unexpected token" }] }); fehlerEnthaelt(erg, /kein gültiges JSON/); });
test("BPE unbekannt", () => { const d = gueltig(); d.bpe = "9.9"; fehlerEnthaelt(lauf(d), /BPE „9\.9“/); });
test("Jahrgang passt nicht zur BPE", () => { const d = gueltig(); d.jahrgang = 12; fehlerEnthaelt(lauf(d), /Jahrgang 12 passt nicht/); });
test("ID passt nicht zum Dateinamen", () => { fehlerEnthaelt(lauf(gueltig(), "andere-datei.json"), /passt nicht zum Dateinamen/); });
test("ID mit unzulässigen Zeichen", () => { const d = gueltig(); d.id = "Falsch_ID"; fehlerEnthaelt(lauf(d, "Falsch_ID.json"), /unzulässige Zeichen/); });
test("Frage-ID beginnt nicht mit Stunden-ID", () => { const d = gueltig(); d.fragen[0].id = "irgendwas-q01"; fehlerEnthaelt(lauf(d), /muss mit der Stunden-ID/); });

test("doppelte IDs über mehrere Dateien", () => {
  const a = baueStunde({ id: "11-1.1-a" });
  const b = baueStunde({ id: "11-1.1-b" });
  b.fragen[0].id = a.fragen[0].id;
  const erg = pruefe({ bpe, lernhinweise, dateien: [{ datei: "11-1.1-a.json", daten: a }, { datei: "11-1.1-b.json", daten: b }] });
  fehlerEnthaelt(erg, /kommt auch in/);
});

test("nicht genau 10 Fragen", () => { const d = gueltig(); d.fragen.pop(); fehlerEnthaelt(lauf(d), /9 Fragen vorhanden, es müssen genau 10/); });
test("nicht genau 4 Antworten", () => { const d = gueltig(); d.fragen[2].antworten.pop(); fehlerEnthaelt(lauf(d), /genau 4 Antworten/); });
test("leere Antwort", () => { const d = gueltig(); d.fragen[2].antworten[1] = "  "; fehlerEnthaelt(lauf(d), /leer/); });
test("gleiche Antworten", () => { const d = gueltig(); d.fragen[2].antworten[1] = d.fragen[2].antworten[0]; fehlerEnthaelt(lauf(d), /gleich/); });
test("richtig außerhalb 0 bis 3", () => { const d = gueltig(); d.fragen[0].richtig = 4; fehlerEnthaelt(lauf(d), /„richtig“ muss eine Zahl von 0 bis 3/); });
test("leere Erklärung", () => { const d = gueltig(); d.fragen[0].erklaerung = ""; fehlerEnthaelt(lauf(d), /erklaerung/); });
test("Verteilung leicht/anspruchsvoller falsch", () => { const d = gueltig(); d.fragen[0].schwierigkeit = "anspruchsvoller"; fehlerEnthaelt(lauf(d), /genau 3 leichte und 7/); });
test("Verteilung Kern/Neben falsch", () => { const d = gueltig(); d.fragen[8].relevanz = "kern"; fehlerEnthaelt(lauf(d), /genau 8 Kern- und 2 Nebenfragen/); });
test("Kompetenzen: zu wenige", () => { const d = gueltig(); d.kompetenzen = d.kompetenzen.slice(0, 2); fehlerEnthaelt(lauf(d), /3 oder 4 sein/); });
test("Kompetenz ohne Lernhinweis Stufe 4", () => { const d = gueltig(); delete d.kompetenzen[0].lernhinweise[4]; fehlerEnthaelt(lauf(d), /Stufe 4 fehlt/); });
test("lesetext_ref zeigt ins Leere (Frage)", () => { const d = gueltig(); d.fragen[0].lesetext_ref = "zz"; fehlerEnthaelt(lauf(d), /lesetext_ref/); });
test("lesetext_ref zeigt ins Leere (Kompetenz)", () => { const d = gueltig(); d.kompetenzen[0].lesetext_ref = "zz"; fehlerEnthaelt(lauf(d), /Kompetenz .*lesetext_ref/); });
test("doppelter Fragetext", () => { const d = gueltig(); d.fragen[1].frage = d.fragen[0].frage; fehlerEnthaelt(lauf(d), /Fragetext kommt schon/); });
test("verbotene Antwortformel", () => { const d = gueltig(); d.fragen[0].antworten[3] = "Alle genannten"; fehlerEnthaelt(lauf(d), /verbotene Formel/); });

test("Warnung (kein Fehler), wenn die richtige Antwort zu oft die längste ist", () => {
  const d = gueltig();
  for (const q of d.fragen) q.antworten[q.richtig] += " mit einem deutlich längeren Zusatz";
  const erg = lauf(d);
  assert.deepEqual(erg.fehler, []);
  assert.ok(erg.warnungen.some((w) => /die längste/.test(w)));
});
