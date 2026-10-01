// Lernstand: Speicherformat, sicherer Zugriff auf localStorage, Export/Import.
import { STORAGE_KEY, STAND_SCHEMA_VERSION } from "./config.js";

export function leererStand() {
  return { schema_version: STAND_SCHEMA_VERSION, boxes: {}, quiz: {}, selbst: {}, auswahl: [] };
}

// Liefert localStorage oder, wenn blockiert, einen Speicher im Arbeitsspeicher.
export function sichererSpeicher() {
  try {
    const s = globalThis.localStorage;
    const probe = "ggk-lernhilfe:probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => void m.set(k, String(v)),
      removeItem: (k) => void m.delete(k),
    };
  }
}

const istObjekt = (x) => x && typeof x === "object" && !Array.isArray(x);

// Bringt beliebige (auch ältere oder beschädigte) Daten in die aktuelle Form.
export function normalisiere(roh) {
  const stand = leererStand();
  if (!istObjekt(roh)) return stand;
  // Platz für künftige Migrationen: if (roh.schema_version < 2) { ... }
  if (istObjekt(roh.boxes)) {
    for (const [id, e] of Object.entries(roh.boxes)) {
      if (!istObjekt(e)) continue;
      const kasten = Number.isInteger(e.kasten) ? Math.min(5, Math.max(1, e.kasten)) : 1;
      stand.boxes[id] = {
        kasten,
        richtig: Number.isInteger(e.richtig) && e.richtig >= 0 ? e.richtig : 0,
        falsch: Number.isInteger(e.falsch) && e.falsch >= 0 ? e.falsch : 0,
        zuletzt: typeof e.zuletzt === "string" ? e.zuletzt : null,
      };
    }
  }
  const ergebnis = (r) =>
    istObjekt(r) && Number.isInteger(r.punkte) && Number.isInteger(r.von) && r.von > 0
      ? { punkte: r.punkte, von: r.von, datum: typeof r.datum === "string" ? r.datum : null }
      : null;
  if (istObjekt(roh.quiz)) {
    for (const [id, q] of Object.entries(roh.quiz)) {
      if (!istObjekt(q)) continue;
      const letzt = ergebnis(q.letzt);
      const best = ergebnis(q.best);
      if (letzt || best) stand.quiz[id] = { letzt: letzt || best, best: best || letzt };
    }
  }
  if (istObjekt(roh.selbst)) {
    for (const [id, s] of Object.entries(roh.selbst)) {
      if (istObjekt(s) && [1, 2, 3, 4].includes(s.stufe)) {
        stand.selbst[id] = { stufe: s.stufe, datum: typeof s.datum === "string" ? s.datum : null };
      }
    }
  }
  if (Array.isArray(roh.auswahl)) stand.auswahl = roh.auswahl.filter((x) => typeof x === "string");
  return stand;
}

export function ladeStand(speicher) {
  try {
    const text = speicher.getItem(STORAGE_KEY);
    return text ? normalisiere(JSON.parse(text)) : leererStand();
  } catch {
    return leererStand();
  }
}

// Gibt true zurück, wenn gespeichert werden konnte.
export function speichereStand(speicher, stand) {
  try {
    speicher.setItem(STORAGE_KEY, JSON.stringify(stand));
    return true;
  } catch {
    return false;
  }
}

// Entfernt Einträge zu Fragen, Kompetenzen und Stunden, die es nicht mehr gibt.
export function bereinige(stand, { frageIds, kompetenzIds, stundenIds }) {
  for (const id of Object.keys(stand.boxes)) if (!frageIds.has(id)) delete stand.boxes[id];
  for (const id of Object.keys(stand.selbst)) if (!kompetenzIds.has(id)) delete stand.selbst[id];
  for (const id of Object.keys(stand.quiz)) {
    if (!id.startsWith("bpe:") && !stundenIds.has(id)) delete stand.quiz[id];
  }
  stand.auswahl = stand.auswahl.filter((id) => stundenIds.has(id));
  return stand;
}

export function exportiere(stand, jetzt = new Date()) {
  return JSON.stringify(
    { format: "ggk-lernhilfe-lernstand", exportiert: jetzt.toISOString(), stand },
    null,
    2
  );
}

// Liest eine Exportdatei. Wirft einen Error mit deutscher Meldung, wenn sie nicht passt.
export function parseImport(text) {
  let daten;
  try {
    daten = JSON.parse(text);
  } catch {
    throw new Error("Die Datei ist keine gültige Lernstand-Datei (kein lesbares JSON).");
  }
  if (!istObjekt(daten) || daten.format !== "ggk-lernhilfe-lernstand" || !istObjekt(daten.stand)) {
    throw new Error("Die Datei stammt nicht aus der GGK-Lernhilfe.");
  }
  return normalisiere(daten.stand);
}

// Führt zwei Lernstände zusammen: jeweils der neuere Eintrag, beim Quiz das beste Ergebnis.
export function zusammenfuehren(aktuell, import_) {
  const ziel = normalisiere(aktuell);
  for (const [id, e] of Object.entries(import_.boxes)) {
    const a = ziel.boxes[id];
    if (!a || String(e.zuletzt || "") > String(a.zuletzt || "")) ziel.boxes[id] = { ...e };
  }
  const proz = (r) => r.punkte / r.von;
  for (const [id, q] of Object.entries(import_.quiz)) {
    const a = ziel.quiz[id];
    if (!a) {
      ziel.quiz[id] = { letzt: { ...q.letzt }, best: { ...q.best } };
      continue;
    }
    ziel.quiz[id] = {
      letzt: String(q.letzt.datum || "") > String(a.letzt.datum || "") ? { ...q.letzt } : a.letzt,
      best: proz(q.best) > proz(a.best) ? { ...q.best } : a.best,
    };
  }
  for (const [id, s] of Object.entries(import_.selbst)) {
    const a = ziel.selbst[id];
    if (!a || String(s.datum || "") > String(a.datum || "")) ziel.selbst[id] = { ...s };
  }
  return ziel;
}

// Speichert ein Quizergebnis (letztes und bestes) unter der Schlüssel-ID.
export function trageQuizEin(stand, schluessel, punkte, von, jetzt = new Date()) {
  const neu = { punkte, von, datum: jetzt.toISOString() };
  const alt = stand.quiz[schluessel];
  const besser = !alt || punkte / von >= alt.best.punkte / alt.best.von;
  stand.quiz[schluessel] = { letzt: neu, best: besser ? neu : alt.best };
  return stand;
}
