// Kompetenzcheck: Mittelwert, Ampel, Soll-Ist-Vergleich, Lernhinweis.
import { AMPEL, SOLL_IST, SOLL_IST_TEXTE } from "./config.js";
import { prozent } from "./quiz.js";

// Mittelwert der zuletzt gespeicherten Einschätzungen der Kann-Aussagen einer Stunde.
export function mittelwert(stunde, selbst) {
  const werte = (stunde.kompetenzen || [])
    .map((k) => selbst && selbst[k.id] && selbst[k.id].stufe)
    .filter((w) => Number.isFinite(w));
  if (!werte.length) return null;
  return werte.reduce((a, b) => a + b, 0) / werte.length;
}

export function ampel(mw) {
  if (mw == null) return null;
  if (mw <= AMPEL.gruenMax) return "gruen";
  if (mw <= AMPEL.gelbMax) return "gelb";
  return "rot";
}

export const AMPEL_TEXT = { gruen: "sicher", gelb: "teilweise sicher", rot: "unsicher" };

export function sollIst(mw, quizLetzt) {
  if (mw == null) return null;
  const p = prozent(quizLetzt);
  if (p == null) return SOLL_IST_TEXTE.keinQuiz;
  if (mw <= SOLL_IST.sicherMax && p < SOLL_IST.quizNiedrig) return SOLL_IST_TEXTE.unstimmigKeinWissen;
  if (mw >= SOLL_IST.unsicherMin && p >= SOLL_IST.quizHoch) return SOLL_IST_TEXTE.zuBescheiden;
  return null;
}

// Drei Teile: stundenspezifisch, allgemein je Stufe, Zusatz je Kompetenztyp.
export function lernhinweis(kompetenz, stufe, lernhinweise) {
  return {
    spezifisch: (kompetenz.lernhinweise && kompetenz.lernhinweise[String(stufe)]) || "",
    allgemein: (lernhinweise.stufen && lernhinweise.stufen[String(stufe)]) || "",
    typ: (lernhinweise.typen && lernhinweise.typen[kompetenz.typ]) || "",
  };
}
