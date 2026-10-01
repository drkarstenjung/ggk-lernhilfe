// Erzeugt die Beispiel- und Testdateien (Dateinamen beginnen mit „_“, werden im Normalbetrieb nicht angezeigt).
import { writeFileSync } from "node:fs";
import { baueStunde } from "../tests/helpers.mjs";

const out = (name, d) => writeFileSync(new URL(`../data/lessons/${name}`, import.meta.url), JSON.stringify(d, null, 2) + "\n");
out("_beispiel.json", baueStunde({ id: "beispiel", titel: "Beispielstunde (Vorlage)", bpe: "1.1", jahrgang: 11 }));
out("_test-a.json", baueStunde({ id: "test-a", titel: "Testdaten A", bpe: "1.1", jahrgang: 11, reihenfolge: 2 }));
out("_test-b.json", baueStunde({ id: "test-b", titel: "Testdaten B", bpe: "2.1", jahrgang: 12, reihenfolge: 1 }));
