import test from "node:test";
import assert from "node:assert/strict";
import { quizFuerStunde, quizFuerBpe } from "../app/js/quiz.js";
import { mulberry32 } from "../app/js/rng.js";
import { baueStunde } from "./helpers.mjs";

test("Stunde: genau die 10 festen Fragen, drei leichte zuerst", () => {
  const s = baueStunde({ id: "x-a" });
  const q = quizFuerStunde(s, mulberry32(3));
  assert.equal(q.length, 10);
  assert.deepEqual(new Set(q.map((f) => f.id)), new Set(s.fragen.map((f) => f.id)));
  assert.ok(q.slice(0, 3).every((f) => f.schwierigkeit === "leicht"));
  assert.ok(q.slice(3).every((f) => f.schwierigkeit === "anspruchsvoller"));
});

test("Stunde: Antwortpositionen werden bei jedem Durchgang neu gemischt", () => {
  const s = baueStunde({ id: "x-a" });
  const rng = mulberry32(5);
  const sigs = new Set();
  for (let i = 0; i < 20; i++) {
    const q = quizFuerStunde(s, rng);
    sigs.add(q.map((f) => f.richtig).join(""));
    for (const f of q) assert.match(f.antworten[f.richtig], /^Richtige Antwort/);
  }
  assert.ok(sigs.size > 5);
});

test("ganze BPE: 10 Fragen mit 3 leichten, 7 anspruchsvolleren, 8 Kern, 2 Neben", () => {
  const stunden = [baueStunde({ id: "x-a" }), baueStunde({ id: "x-b" }), baueStunde({ id: "x-c" })];
  for (let seed = 1; seed <= 25; seed++) {
    const q = quizFuerBpe(stunden, mulberry32(seed));
    assert.equal(q.length, 10);
    assert.equal(new Set(q.map((f) => f.id)).size, 10);
    assert.equal(q.filter((f) => f.schwierigkeit === "leicht").length, 3);
    assert.equal(q.filter((f) => f.relevanz === "kern").length, 8);
    assert.ok(q.slice(0, 3).every((f) => f.schwierigkeit === "leicht"));
  }
});

test("ganze BPE: Pool-Grenzen werden beachtet, keine Frage doppelt, Pool < 10 stellt alle", () => {
  const s = baueStunde({ id: "x-a" });
  const klein = { ...s, fragen: s.fragen.slice(0, 4) }; // 3 leicht + 1 anspruchsvoller, alle kern
  const q = quizFuerBpe([klein], mulberry32(9));
  assert.equal(q.length, 4);

  // Pool ohne leichte Fragen: Schichtung nicht möglich, trotzdem 10 Fragen
  const ohneLeicht = { ...s, fragen: s.fragen.map((f) => ({ ...f, schwierigkeit: "anspruchsvoller" })) };
  const q2 = quizFuerBpe([ohneLeicht, baueStunde({ id: "x-b" })], mulberry32(9));
  assert.equal(q2.length, 10);
  assert.equal(new Set(q2.map((f) => f.id)).size, 10);
});
