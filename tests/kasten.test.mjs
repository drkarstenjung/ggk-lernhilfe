import test from "node:test";
import assert from "node:assert/strict";
import { antworten, ziehe, fortschritt, kastenVon } from "../app/js/kasten.js";
import { mulberry32, mischeAntworten } from "../app/js/rng.js";

test("Aufstieg um eine Stufe, maximal Kasten 5", () => {
  let e = null;
  for (let i = 1; i <= 7; i++) e = antworten(e, true);
  assert.equal(e.kasten, 5);
  assert.equal(e.richtig, 7);
  assert.equal(antworten(null, true).kasten, 2);
});

test("falsche Antwort setzt in Kasten 1 zurück und zählt mit", () => {
  const e = antworten({ kasten: 4, richtig: 3, falsch: 0, zuletzt: null }, false);
  assert.equal(e.kasten, 1);
  assert.equal(e.falsch, 1);
  assert.equal(e.richtig, 3);
  assert.ok(e.zuletzt);
});

const pool = (n) => Array.from({ length: n }, (_, i) => ({ id: `f${i}` }));

test("Ziehung ohne Zurücklegen: 10 verschiedene Fragen", () => {
  const rng = mulberry32(1);
  const z = ziehe(pool(40), {}, 10, rng);
  assert.equal(z.length, 10);
  assert.equal(new Set(z.map((f) => f.id)).size, 10);
});

test("Pool kleiner als 10: alle Fragen werden gestellt", () => {
  const z = ziehe(pool(6), {}, 10, mulberry32(2));
  assert.equal(z.length, 6);
  assert.equal(new Set(z.map((f) => f.id)).size, 6);
});

test("Ziehung ist nach Kasten gewichtet (Kasten 1 häufiger als Kasten 5)", () => {
  const p = pool(20);
  const boxes = {};
  p.slice(0, 10).forEach((f) => (boxes[f.id] = { kasten: 1 }));
  p.slice(10).forEach((f) => (boxes[f.id] = { kasten: 5 }));
  const rng = mulberry32(42);
  let aus1 = 0, aus5 = 0;
  for (let i = 0; i < 400; i++) {
    for (const f of ziehe(p, boxes, 10, rng)) boxes[f.id].kasten === 1 ? aus1++ : aus5++;
  }
  assert.ok(aus1 > aus5 * 1.4, `Kasten 1: ${aus1}, Kasten 5: ${aus5}`);
});

test("Fortschritt = Anteil in Kasten 4 und 5; unbekannte Frage zählt als Kasten 1", () => {
  const p = pool(4);
  const boxes = { f0: { kasten: 4 }, f1: { kasten: 5 }, f2: { kasten: 3 } };
  const fo = fortschritt(p, boxes);
  assert.equal(fo.hoch, 2);
  assert.equal(fo.anteil, 0.5);
  assert.equal(kastenVon(boxes, "f3"), 1);
});

test("Mischen der Antwortpositionen führt den Index der richtigen Antwort mit", () => {
  const frage = { antworten: ["a", "b", "c", "d"], richtig: 2 };
  const rng = mulberry32(7);
  const positionen = new Set();
  for (let i = 0; i < 100; i++) {
    const m = mischeAntworten(frage, rng);
    assert.equal(m.antworten[m.richtig], "c");
    assert.deepEqual([...m.antworten].sort(), ["a", "b", "c", "d"]);
    positionen.add(m.richtig);
  }
  assert.equal(positionen.size, 4);
  assert.equal(frage.richtig, 2); // Original unverändert
});
