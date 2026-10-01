import test from "node:test";
import assert from "node:assert/strict";
import { leererStand, ladeStand, speichereStand, exportiere, parseImport, zusammenfuehren, bereinige, normalisiere, trageQuizEin, sichererSpeicher } from "../app/js/store.js";

const speicher = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

test("Speichern und Laden", () => {
  const sp = speicher();
  const st = leererStand();
  st.boxes.a = { kasten: 3, richtig: 2, falsch: 1, zuletzt: "2026-01-01T00:00:00.000Z" };
  assert.equal(speichereStand(sp, st), true);
  assert.deepEqual(ladeStand(sp).boxes.a, st.boxes.a);
});

test("blockierter oder defekter Speicher: App arbeitet mit leerem Stand weiter", () => {
  const kaputt = { getItem: () => { throw new Error("blockiert"); }, setItem: () => { throw new Error("blockiert"); } };
  assert.deepEqual(ladeStand(kaputt), leererStand());
  assert.equal(speichereStand(kaputt, leererStand()), false);
  const defekt = { getItem: () => "{kein json" };
  assert.deepEqual(ladeStand(defekt), leererStand());
  assert.ok(sichererSpeicher()); // ohne localStorage: Arbeitsspeicher-Ersatz
});

test("Export und Import ergeben denselben Stand; fremde Dateien werden abgelehnt", () => {
  const st = leererStand();
  st.boxes.a = { kasten: 2, richtig: 1, falsch: 0, zuletzt: "2026-02-01T00:00:00.000Z" };
  st.quiz.s1 = { letzt: { punkte: 7, von: 10, datum: "d" }, best: { punkte: 9, von: 10, datum: "d" } };
  st.selbst.k1 = { stufe: 2, datum: "d" };
  st.auswahl = ["s1"];
  assert.deepEqual(parseImport(exportiere(st)), st);
  assert.throws(() => parseImport("kein json"), /JSON/);
  assert.throws(() => parseImport('{"foo":1}'), /nicht aus der GGK-Lernhilfe/);
});

test("Zusammenführen: neuerer Eintrag, bestes Quizergebnis", () => {
  const a = leererStand();
  a.boxes.f = { kasten: 2, richtig: 1, falsch: 0, zuletzt: "2026-01-01T00:00:00.000Z" };
  a.quiz.s = { letzt: { punkte: 5, von: 10, datum: "2026-01-01" }, best: { punkte: 8, von: 10, datum: "2025-12-01" } };
  const b = leererStand();
  b.boxes.f = { kasten: 4, richtig: 3, falsch: 0, zuletzt: "2026-03-01T00:00:00.000Z" };
  b.boxes.g = { kasten: 1, richtig: 0, falsch: 1, zuletzt: null };
  b.quiz.s = { letzt: { punkte: 9, von: 10, datum: "2026-03-01" }, best: { punkte: 9, von: 10, datum: "2026-03-01" } };
  const z = zusammenfuehren(a, b);
  assert.equal(z.boxes.f.kasten, 4);
  assert.ok(z.boxes.g);
  assert.equal(z.quiz.s.best.punkte, 9);
  assert.equal(z.quiz.s.letzt.punkte, 9);
});

test("unbekannte IDs werden beim Bereinigen entfernt, Quiz-BPE-Einträge bleiben", () => {
  const st = leererStand();
  st.boxes = { alt: { kasten: 2, richtig: 0, falsch: 0, zuletzt: null }, neu: { kasten: 2, richtig: 0, falsch: 0, zuletzt: null } };
  st.quiz = { "bpe:1.1": { letzt: { punkte: 1, von: 2, datum: null }, best: { punkte: 1, von: 2, datum: null } }, weg: { letzt: { punkte: 1, von: 2, datum: null }, best: { punkte: 1, von: 2, datum: null } } };
  st.auswahl = ["s1", "weg"];
  bereinige(st, { frageIds: new Set(["neu"]), kompetenzIds: new Set(), stundenIds: new Set(["s1"]) });
  assert.deepEqual(Object.keys(st.boxes), ["neu"]);
  assert.deepEqual(Object.keys(st.quiz), ["bpe:1.1"]);
  assert.deepEqual(st.auswahl, ["s1"]);
});

test("Normalisierung repariert beschädigte Einträge", () => {
  const st = normalisiere({ boxes: { a: { kasten: 99 }, b: "x" }, quiz: { s: { letzt: { punkte: "x" } } }, selbst: { k: { stufe: 7 } }, auswahl: [1, "s"] });
  assert.equal(st.boxes.a.kasten, 5);
  assert.equal(st.boxes.b, undefined);
  assert.deepEqual(st.quiz, {});
  assert.deepEqual(st.selbst, {});
  assert.deepEqual(st.auswahl, ["s"]);
});

test("Quizergebnis: letztes und bestes", () => {
  const st = leererStand();
  trageQuizEin(st, "s", 8, 10);
  trageQuizEin(st, "s", 5, 10);
  assert.equal(st.quiz.s.letzt.punkte, 5);
  assert.equal(st.quiz.s.best.punkte, 8);
});
