// Lädt data/bpe.json, data/lernhinweise.json und alle Stundendateien.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function ladeDaten(wurzel) {
  const lies = (p) => JSON.parse(readFileSync(join(wurzel, p), "utf8"));
  const bpe = lies("data/bpe.json");
  const lernhinweise = lies("data/lernhinweise.json");
  const dir = join(wurzel, "data/lessons");
  const dateien = readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((datei) => {
      try {
        return { datei, daten: JSON.parse(readFileSync(join(dir, datei), "utf8")) };
      } catch (e) {
        return { datei, daten: null, parseFehler: e.message };
      }
    });
  return { bpe, lernhinweise, dateien };
}
