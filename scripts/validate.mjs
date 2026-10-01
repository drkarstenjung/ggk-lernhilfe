// Validiert alle Stundendateien. Exit-Code 1 bei Fehlern.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pruefe } from "./validate-lib.mjs";
import { ladeDaten } from "./lade-daten.mjs";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");

export function validiere() {
  const d = ladeDaten(wurzel);
  const erg = pruefe(d);
  for (const w of erg.warnungen) console.warn(`  ! ${w}`);
  for (const f of erg.fehler) console.error(`  X FEHLER ${f}`);
  console.log(`${d.dateien.length} Stundendatei(en) geprüft: ${erg.fehler.length} Fehler, ${erg.warnungen.length} Warnung(en).`);
  return erg.fehler.length === 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(validiere() ? 0 : 1);
