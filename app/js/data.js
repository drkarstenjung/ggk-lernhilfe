// Lädt Manifest, BPE, Lernhinweise und alle Stundendateien.

async function holeJson(pfad, opts) {
  const r = await fetch(pfad, opts);
  if (!r.ok) throw new Error(`${pfad}: HTTP ${r.status}`);
  return r.json();
}

export async function ladeDaten() {
  const manifest = await holeJson("data/manifest.json", { cache: "no-store" });
  const [bpe, lernhinweise, stunden] = await Promise.all([
    holeJson("data/bpe.json"),
    holeJson("data/lernhinweise.json"),
    Promise.all(manifest.stunden.map((s) => holeJson(s.datei))),
  ]);
  stunden.sort((a, b) => a.reihenfolge - b.reihenfolge || a.id.localeCompare(b.id));
  return baueIndex({ version: manifest.version, bpe, lernhinweise, stunden });
}

export function baueIndex({ version, bpe, lernhinweise, stunden }) {
  const stundenById = new Map(stunden.map((s) => [s.id, s]));
  const fragenById = new Map();
  const kompetenzIds = new Set();
  for (const s of stunden) {
    for (const f of s.fragen) fragenById.set(f.id, { ...f, stundeId: s.id });
    for (const k of s.kompetenzen) kompetenzIds.add(k.id);
  }
  const bpeListe = bpe.map((b) => ({ ...b, stunden: stunden.filter((s) => s.bpe === b.id) }));
  return { version, bpe: bpeListe, lernhinweise, stunden, stundenById, fragenById, kompetenzIds };
}
