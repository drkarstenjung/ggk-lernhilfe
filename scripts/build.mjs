// Validiert, kopiert app/ und data/ nach dist/, erzeugt dist/data/manifest.json und trägt den Hash in sw.js ein.
// Mit --examples werden auch Dateien eingebunden, deren Name mit „_“ beginnt (nur für lokale Tests).
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pruefe } from "./validate-lib.mjs";
import { ladeDaten } from "./lade-daten.mjs";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(wurzel, "dist");
const mitBeispielen = process.argv.includes("--examples");

const d = ladeDaten(wurzel);
const erg = pruefe(d);
erg.warnungen.forEach((w) => console.warn(`  ! ${w}`));
if (erg.fehler.length) {
  erg.fehler.forEach((f) => console.error(`  X FEHLER ${f}`));
  console.error(`\nBuild abgebrochen: ${erg.fehler.length} Fehler in den Stundendateien.`);
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(wurzel, "app"), dist, { recursive: true });
mkdirSync(join(dist, "data/lessons"), { recursive: true });
for (const n of ["bpe.json", "lernhinweise.json"]) cpSync(join(wurzel, "data", n), join(dist, "data", n));

const sichtbar = d.dateien.filter((x) => mitBeispielen || !x.datei.startsWith("_"));
for (const x of sichtbar) cpSync(join(wurzel, "data/lessons", x.datei), join(dist, "data/lessons", x.datei));

const alle = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? alle(p) : [p]; }).sort();

// Inhalts-Hash über App-Dateien (ohne sw.js-Platzhalter) und Daten
const hash = createHash("sha256");
for (const p of alle(dist)) {
  hash.update(relative(dist, p));
  hash.update(readFileSync(p));
}
const version = hash.digest("hex").slice(0, 12);

const dateiVon = new Map(sichtbar.map((x) => [x.daten.id, x.datei]));
const stunden = sichtbar
  .map((x) => x.daten)
  .sort((a, b) => a.bpe.localeCompare(b.bpe) || a.reihenfolge - b.reihenfolge)
  .map((s) => ({ id: s.id, jahrgang: s.jahrgang, bpe: s.bpe, kurztitel: s.kurztitel, reihenfolge: s.reihenfolge, fragen: s.fragen.length, datei: `data/lessons/${dateiVon.get(s.id)}` }));
writeFileSync(join(dist, "data/manifest.json"), JSON.stringify({ version, erzeugt: new Date().toISOString(), stunden }, null, 2));

// Service Worker: Hash und Precache-Liste eintragen
const shell = alle(dist).map((p) => "./" + relative(dist, p)).filter((p) => p !== "./sw.js" && p !== "./data/manifest.json");
shell.unshift("./");
let sw = readFileSync(join(dist, "sw.js"), "utf8");
sw = sw.replace("__BUILD_HASH__", version).replace("__PRECACHE__", JSON.stringify(shell, null, 2));
writeFileSync(join(dist, "sw.js"), sw);

console.log(`Build fertig: dist/ (Version ${version}, ${stunden.length} Stunde(n)${mitBeispielen ? ", mit Beispieldateien" : ""}).`);
