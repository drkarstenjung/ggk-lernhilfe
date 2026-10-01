import { h, leere } from "../dom.js";
import { stundenAuswahl } from "./select.js";
import { zeigeFrage, tastenkuerzel } from "./frage.js";
import { ziehe, antworten, kastenVon } from "../kasten.js";
import { mischeAntworten } from "../rng.js";
import { RUNDE_GROESSE } from "../config.js";

let aufraeumen = null;

function neueRunde(ctx) {
  const ids = new Set(ctx.stand.auswahl);
  const pool = ctx.daten.stunden.filter((s) => ids.has(s.id)).flatMap((s) => s.fragen.map((f) => ({ ...f, stundeId: s.id })));
  if (!pool.length) return false;
  const fragen = ziehe(pool, ctx.stand.boxes, RUNDE_GROESSE).map((f) => mischeAntworten(f));
  const verschiebungen = [];
  ctx.lauf = {
    typ: "lernen",
    titel: "Lernmodus",
    fragen,
    i: 0,
    gewaehlt: null,
    ergebnisse: [],
    verschiebungen,
    zeigeStunde: true,
    kopfzeile: (f) => `Kasten ${kastenVon(ctx.stand.boxes, f.id)}`,
    onAntwort: (f, korrekt) => {
      const von = kastenVon(ctx.stand.boxes, f.id);
      const neu = antworten(ctx.stand.boxes[f.id], korrekt);
      ctx.stand.boxes[f.id] = neu;
      verschiebungen.push({ frage: f, von, nach: neu.kasten, korrekt });
      ctx.speichern();
    },
  };
  return true;
}

export function lernenAuswahl(ctx, el) {
  leere(el);
  const auswahl = new Set(ctx.stand.auswahl.filter((id) => ctx.daten.stundenById.has(id)));
  el.append(h("p", { class: "muted" }, `Wähle eine oder mehrere Stunden. Jede Runde besteht aus ${RUNDE_GROESSE} zufällig gezogenen Fragen. Was du noch nicht sicher kannst, kommt häufiger dran.`));
  const startKnopf = h("button", { type: "button", class: "btn-primaer", onclick: () => { if (neueRunde(ctx)) ctx.gehe("#/lernen/lauf"); } });
  const aktualisiere = () => {
    const n = ctx.daten.stunden.filter((s) => auswahl.has(s.id)).reduce((a, s) => a + s.fragen.length, 0);
    startKnopf.disabled = n === 0;
    startKnopf.replaceChildren(document.createTextNode("Runde starten"), h("span", { class: "btn-unter" }, n ? `${auswahl.size} Stunde(n), ${n} Fragen im Pool` : "Wähle mindestens eine Stunde"));
  };
  el.append(
    stundenAuswahl(ctx, {
      modus: "mehrfach",
      auswahl,
      onAuswahl: () => { ctx.stand.auswahl = [...auswahl]; ctx.speichern(); aktualisiere(); },
    }),
    h("div", { class: "start-leiste" }, startKnopf)
  );
  aktualisiere();
  return "Lernmodus";
}

export function lernenLauf(ctx, el) {
  const s = ctx.lauf;
  if (!s || s.typ !== "lernen") { ctx.gehe("#/lernen", true); return "Lernmodus"; }
  zeigeFrage(ctx, el, s, { onFertig: () => ctx.gehe("#/lernen/ende") });
  aufraeumen = tastenkuerzel(el);
  return "Lernmodus";
}

export function lernenEnde(ctx, el) {
  const s = ctx.lauf;
  if (!s || s.typ !== "lernen" || s.ergebnisse.length < s.fragen.length) { ctx.gehe("#/lernen", true); return "Lernmodus"; }
  leere(el);
  const richtig = s.ergebnisse.filter((x) => x.korrekt).length;
  const hoch = s.verschiebungen.filter((v) => v.nach > v.von).length;
  const zurueck = s.verschiebungen.filter((v) => v.nach < v.von).length;
  const gesichert = s.verschiebungen.filter((v) => v.nach === 5 && v.von < 5).length;
  el.append(
    h("p", { class: "punktzahl" }, `${richtig} von ${s.fragen.length} richtig`),
    h("p", { class: "muted" }, `${hoch} Frage(n) eine Stufe höher, ${zurueck} zurück in Kasten 1${gesichert ? `, ${gesichert} neu gesichert (Kasten 5)` : ""}.`),
    h("ul", { class: "verschiebungen" },
      s.verschiebungen.map((v) =>
        h("li", { class: v.korrekt ? "ok" : "nok" }, h("span", { class: "v-status" }, v.korrekt ? "Richtig" : "Falsch"), h("span", { class: "v-text" }, v.frage.frage), h("span", { class: "v-kasten" }, `Kasten ${v.von} → ${v.nach}`))
      )
    ),
    h("div", { class: "aktionen" },
      h("button", { type: "button", class: "btn-primaer", onclick: () => { if (neueRunde(ctx)) ctx.gehe("#/lernen/lauf"); } }, "Nächste Runde"),
      h("a", { class: "btn-sekundaer", href: "#/lernen" }, "Auswahl ändern"),
      h("a", { class: "btn-text", href: "#/" }, "Zur Startseite")
    )
  );
  return "Runde beendet";
}

export function lernenAufraeumen() {
  if (aufraeumen) { aufraeumen(); aufraeumen = null; }
}
