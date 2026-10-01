import { h, icon } from "./dom.js";
import { ladeDaten } from "./data.js";
import { sichererSpeicher, ladeStand, speichereStand, bereinige } from "./store.js";
import { META_KEY } from "./config.js";
import { startAnsicht } from "./views/home.js";
import { quizAuswahl, quizLauf, quizErgebnis, quizAufraeumen } from "./views/quiz.js";
import { lernenAuswahl, lernenLauf, lernenEnde, lernenAufraeumen } from "./views/lernen.js";
import { checkAuswahl, checkStunde } from "./views/check.js";
import { lesenListe, lesenStunde } from "./views/lesen.js";
import { standAnsicht } from "./views/stand.js";
import { infoAnsicht } from "./views/info.js";

const app = document.getElementById("app");
const titel = document.getElementById("topbar-title");
const zurueckKnopf = document.getElementById("btn-back");
const banner = document.getElementById("banner");

const speicher = sichererSpeicher();
const ctx = {
  daten: null,
  stand: ladeStand(speicher),
  lauf: null, // laufendes Quiz bzw. laufende Lernrunde (bleibt beim Nachlesen erhalten)
  navZaehler: 0,
  speichern() {
    if (!speichereStand(speicher, ctx.stand) && !ctx.warnungGezeigt) {
      ctx.warnungGezeigt = true;
      zeigeBanner("Dein Lernstand konnte nicht gespeichert werden (Browser-Speicher blockiert). Er gilt nur, solange die App geöffnet bleibt.", null);
    }
  },
  gueltige() {
    return { frageIds: new Set(ctx.daten.fragenById.keys()), kompetenzIds: ctx.daten.kompetenzIds, stundenIds: new Set(ctx.daten.stundenById.keys()) };
  },
  gehe(hash, ersetzen) {
    if (ersetzen) location.replace(hash);
    else location.hash = hash;
  },
  zurueck(fallback) {
    if (ctx.navZaehler > 0) history.back();
    else ctx.gehe(fallback || "#/");
  },
};

document.getElementById("nav-stand").append(icon("stand"));
document.getElementById("nav-info").append(icon("info"));
zurueckKnopf.append(icon("zurueck"));
zurueckKnopf.addEventListener("click", () => {
  const teile = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  ctx.zurueck(teile.length > 1 ? "#/" + teile.slice(0, -1).join("/") : "#/");
});

function zeigeBanner(text, aktion) {
  banner.hidden = false;
  banner.replaceChildren(h("span", null, text), aktion ? h("button", { type: "button", class: "btn-banner", onclick: aktion.fn }, aktion.label) : null);
}

function route() {
  quizAufraeumen();
  lernenAufraeumen();
  const teile = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/").filter(Boolean);
  const [a, b, c] = teile;
  let t = "GGK-Lernhilfe";
  const el = app;
  if (!a) t = startAnsicht(ctx, el);
  else if (a === "quiz") t = !b ? quizAuswahl(ctx, el) : b === "lauf" ? quizLauf(ctx, el) : quizErgebnis(ctx, el);
  else if (a === "lernen") t = !b ? lernenAuswahl(ctx, el) : b === "lauf" ? lernenLauf(ctx, el) : lernenEnde(ctx, el);
  else if (a === "check") t = !b ? checkAuswahl(ctx, el) : checkStunde(ctx, el, b);
  else if (a === "lesen") t = !b ? lesenListe(ctx, el) : lesenStunde(ctx, el, b, c);
  else if (a === "stand") t = standAnsicht(ctx, el);
  else if (a === "info") t = infoAnsicht(ctx, el);
  else t = startAnsicht(ctx, el);
  titel.textContent = t;
  document.title = a ? `${t} – GGK-Lernhilfe` : "GGK-Lernhilfe";
  zurueckKnopf.hidden = !a;
  if (!(a === "lesen" && c)) { window.scrollTo(0, 0); }
}

window.addEventListener("hashchange", () => { ctx.navZaehler++; route(); });

// Aktualisierung: Banner bei neuer Version, Aktivierung nur auf Tipp.
async function pruefeAktualisierung(registration) {
  let bekannt = null;
  try { bekannt = JSON.parse(speicher.getItem(META_KEY) || "{}").version || null; } catch { /* egal */ }
  const merke = () => { try { speicher.setItem(META_KEY, JSON.stringify({ version: ctx.daten.version })); } catch { /* egal */ } };
  const aktualisieren = (worker) => () => {
    merke();
    if (worker) {
      navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
      worker.postMessage("SKIP_WAITING");
    } else location.reload();
  };
  const neuerWorker = registration && registration.waiting && navigator.serviceWorker.controller ? registration.waiting : null;
  if (neuerWorker) zeigeBanner("Neue Fragen verfügbar.", { label: "Jetzt aktualisieren", fn: aktualisieren(neuerWorker) });
  else if (bekannt && bekannt !== ctx.daten.version) zeigeBanner("Neue Fragen verfügbar.", { label: "Jetzt aktualisieren", fn: aktualisieren(null) });
  else merke();
  if (registration) {
    registration.addEventListener("updatefound", () => {
      const w = registration.installing;
      if (!w) return;
      w.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) zeigeBanner("Neue Fragen verfügbar.", { label: "Jetzt aktualisieren", fn: aktualisieren(w) });
      });
    });
    registration.update().catch(() => {});
  }
}

async function start() {
  let registration = null;
  if ("serviceWorker" in navigator) {
    try { registration = await navigator.serviceWorker.register("sw.js"); } catch { /* ohne Service Worker weiter */ }
  }
  try {
    ctx.daten = await ladeDaten();
  } catch (e) {
    app.replaceChildren(h("p", { class: "hinweis-box" }, "Die Inhalte konnten nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu."));
    return;
  }
  ctx.stand = bereinige(ctx.stand, ctx.gueltige());
  ctx.speichern();
  route();
  pruefeAktualisierung(registration);
}
start();
