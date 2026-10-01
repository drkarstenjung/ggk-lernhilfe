// Zusammenstellung der Quizfragen.
import { QUIZ } from "./config.js";
import { shuffle, mischeAntworten } from "./rng.js";

function ordne(auswahl, rng) {
  // Die leichten Fragen zuerst, danach die anspruchsvolleren in zufälliger Reihenfolge.
  const leicht = shuffle(auswahl.filter((f) => f.schwierigkeit === "leicht"), rng);
  const rest = shuffle(auswahl.filter((f) => f.schwierigkeit !== "leicht"), rng);
  return [...leicht, ...rest].map((f) => mischeAntworten(f, rng));
}

// Eine Stunde: genau die zehn vorgegebenen Fragen.
export function quizFuerStunde(stunde, rng = Math.random) {
  return ordne(stunde.fragen.map((f) => ({ ...f, stundeId: stunde.id })), rng);
}

// Ganze BPE: 10 Fragen, geschichtet nach Schwierigkeit (3:7) und Relevanz (8:2),
// soweit der Pool es hergibt.
export function quizFuerBpe(stunden, rng = Math.random) {
  const pool = stunden.flatMap((s) => s.fragen.map((f) => ({ ...f, stundeId: s.id })));
  const gesamt = Math.min(QUIZ.anzahl, pool.length);
  const zellen = {};
  for (const f of pool) {
    const k = `${f.schwierigkeit === "leicht" ? "L" : "A"}${f.relevanz === "kern" ? "K" : "N"}`;
    (zellen[k] ||= []).push(f);
  }
  const keys = ["LK", "LN", "AK", "AN"];
  const verfuegbar = Object.fromEntries(keys.map((k) => [k, (zellen[k] || []).length]));
  const zielLeicht = (gesamt * QUIZ.leicht) / QUIZ.anzahl;
  const zielKern = (gesamt * QUIZ.kern) / QUIZ.anzahl;

  // Alle zulässigen Verteilungen durchprobieren, die mit der Summe passen; kleinste Abweichung gewinnt.
  let beste = [];
  let besteAbw = Infinity;
  for (let lk = 0; lk <= Math.min(verfuegbar.LK, gesamt); lk++)
    for (let ln = 0; ln <= Math.min(verfuegbar.LN, gesamt - lk); ln++)
      for (let ak = 0; ak <= Math.min(verfuegbar.AK, gesamt - lk - ln); ak++) {
        const an = gesamt - lk - ln - ak;
        if (an > verfuegbar.AN) continue;
        const abw = Math.abs(lk + ln - zielLeicht) + Math.abs(lk + ak - zielKern);
        if (abw < besteAbw - 1e-9) {
          besteAbw = abw;
          beste = [{ lk, ln, ak, an }];
        } else if (Math.abs(abw - besteAbw) < 1e-9) beste.push({ lk, ln, ak, an });
      }
  const wahl = beste[Math.floor(rng() * beste.length)] || { lk: 0, ln: 0, ak: 0, an: 0 };
  const auswahl = [];
  for (const [k, n] of [["LK", wahl.lk], ["LN", wahl.ln], ["AK", wahl.ak], ["AN", wahl.an]]) {
    auswahl.push(...shuffle(zellen[k] || [], rng).slice(0, n));
  }
  return ordne(auswahl, rng);
}

export function prozent(ergebnis) {
  return ergebnis && ergebnis.von ? (100 * ergebnis.punkte) / ergebnis.von : null;
}
