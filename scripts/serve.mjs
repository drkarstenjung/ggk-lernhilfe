// Einfacher statischer Server für dist/ (lokaler Test): npm run serve [-- Port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.argv[2]) || 8080;
const typen = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  let pfad = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pfad.endsWith("/")) pfad += "index.html";
  const datei = normalize(join(dist, pfad));
  if (!datei.startsWith(dist)) { res.writeHead(403).end(); return; }
  try {
    const inhalt = await readFile(datei);
    res.writeHead(200, { "Content-Type": typen[extname(datei)] || "application/octet-stream", "Cache-Control": "no-cache" }).end(inhalt);
  } catch {
    res.writeHead(404).end("Nicht gefunden");
  }
}).listen(port, () => console.log(`GGK-Lernhilfe läuft auf http://localhost:${port}/`));
