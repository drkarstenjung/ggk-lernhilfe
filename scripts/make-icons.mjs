// Rendert die PNG-Icons aus app/icons/icon.svg (Dev-Werkzeug; die PNGs werden committet).
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const svg = readFileSync(new URL("../app/icons/icon.svg", import.meta.url), "utf8");
const quadratisch = svg.replace('rx="96"', 'rx="0"');
const png = (quelle, groesse) => new Resvg(quelle, { fitTo: { mode: "width", value: groesse } }).render().asPng();
const aus = (name, daten) => writeFileSync(new URL(`../app/icons/${name}`, import.meta.url), daten);

aus("icon-192.png", png(svg, 192));
aus("icon-512.png", png(svg, 512));
aus("icon-maskable-512.png", png(quadratisch, 512)); // Inhalt liegt in der inneren 80-%-Sicherheitszone
aus("apple-touch-icon.png", png(quadratisch, 180));
aus("favicon-32.png", png(svg, 32));
console.log("Icons erzeugt.");
