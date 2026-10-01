import test from "node:test";
import assert from "node:assert/strict";
import { mittelwert, ampel, sollIst, lernhinweis } from "../app/js/kompetenz.js";
import { SOLL_IST_TEXTE } from "../app/js/config.js";
import { baueStunde } from "./helpers.mjs";
import { readFileSync } from "node:fs";

const s = baueStunde({ id: "x-a" });
const selbst = (...stufen) => Object.fromEntries(stufen.map((st, i) => [`x-a-k${i + 1}`, { stufe: st, datum: "2026-01-01" }]));
const quiz = (p, v = 10) => ({ punkte: p, von: v, datum: "2026-01-02" });

test("Mittelwert und Ampel", () => {
  assert.equal(mittelwert(s, {}), null);
  assert.equal(mittelwert(s, selbst(1, 2, 3)), 2);
  assert.equal(ampel(1.5), "gruen");
  assert.equal(ampel(2.5), "gelb");
  assert.equal(ampel(3.5), "rot");
  assert.equal(ampel(null), null);
});

test("Soll-Ist: sicher eingeschätzt, aber Quiz unter 60 %", () => {
  assert.equal(sollIst(2.0, quiz(5)), SOLL_IST_TEXTE.unstimmigKeinWissen);
  assert.equal(sollIst(2.0, quiz(6)), null);
});

test("Soll-Ist: unsicher eingeschätzt, aber Quiz mindestens 80 %", () => {
  assert.equal(sollIst(3.0, quiz(8)), SOLL_IST_TEXTE.zuBescheiden);
  assert.equal(sollIst(3.0, quiz(7)), null);
  assert.equal(sollIst(2.5, quiz(10)), null);
});

test("Soll-Ist: kein Quiz absolviert", () => {
  assert.equal(sollIst(2, null), SOLL_IST_TEXTE.keinQuiz);
  assert.equal(sollIst(null, quiz(5)), null);
});

test("Lernhinweis besteht aus drei Teilen", () => {
  const lh = JSON.parse(readFileSync(new URL("../data/lernhinweise.json", import.meta.url), "utf8"));
  const h = lernhinweis(s.kompetenzen[1], 3, lh);
  assert.match(h.spezifisch, /Stufe 3/);
  assert.match(h.allgemein, /Es gibt noch Lücken/);
  assert.match(h.typ, /Quellenarbeit/);
});
