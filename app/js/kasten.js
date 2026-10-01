// Lernkasten: 5 Kästen, richtig = eine Stufe höher, falsch = zurück in Kasten 1.
import { KASTEN_MAX, KASTEN_GEWICHTE, RUNDE_GROESSE, FORTSCHRITT_AB_KASTEN } from "./config.js";

export function kastenVon(boxes, frageId) {
  const e = boxes && boxes[frageId];
  return e && Number.isInteger(e.kasten) ? e.kasten : 1;
}

// Gibt einen neuen Eintrag zurück (verändert den alten nicht).
export function antworten(eintrag, korrekt, jetzt = new Date()) {
  const alt = eintrag || { kasten: 1, richtig: 0, falsch: 0, zuletzt: null };
  return {
    kasten: korrekt ? Math.min(KASTEN_MAX, (alt.kasten || 1) + 1) : 1,
    richtig: (alt.richtig || 0) + (korrekt ? 1 : 0),
    falsch: (alt.falsch || 0) + (korrekt ? 0 : 1),
    zuletzt: jetzt.toISOString(),
  };
}

// Gewichtete Ziehung ohne Zurücklegen (Efraimidis-Spirakis): Schlüssel = u^(1/Gewicht).
export function ziehe(fragen, boxes, anzahl = RUNDE_GROESSE, rng = Math.random) {
  const mitSchluessel = fragen.map((f) => {
    const gewicht = KASTEN_GEWICHTE[kastenVon(boxes, f.id)] || 1;
    return { f, schluessel: Math.pow(rng(), 1 / gewicht) };
  });
  mitSchluessel.sort((a, b) => b.schluessel - a.schluessel);
  return mitSchluessel.slice(0, anzahl).map((x) => x.f);
}

// Anteil der Fragen in Kasten 4 und 5.
export function fortschritt(fragen, boxes) {
  const gesamt = fragen.length;
  const hoch = fragen.filter((f) => kastenVon(boxes, f.id) >= FORTSCHRITT_AB_KASTEN).length;
  return { gesamt, hoch, anteil: gesamt ? hoch / gesamt : 0 };
}

export function kastenVerteilung(fragen, boxes) {
  const v = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const f of fragen) v[kastenVon(boxes, f.id)] += 1;
  return v;
}
