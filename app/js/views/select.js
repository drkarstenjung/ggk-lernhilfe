// Gemeinsame Auswahl von Stunden und BPE.
import { h, fortschrittsbalken } from "../dom.js";
import { fortschritt } from "../kasten.js";

const jahrLabel = (j) => `Kl. ${j}`;

function bpeKopf(b, extras) {
  const fo = fortschritt(b.stunden.flatMap((s) => s.fragen), extras.boxes);
  return h(
    "div",
    { class: "bpe-kopf" },
    h("div", { class: "bpe-titelzeile" }, h("span", { class: "label-jahr" }, jahrLabel(b.jahrgang)), h("span", { class: "bpe-nr" }, `BPE ${b.id}`)),
    h("div", { class: "bpe-titel" }, b.titel),
    b.stunden.length ? fortschrittsbalken(fo.anteil, `Lernfortschritt BPE ${b.id}: ${fo.hoch} von ${fo.gesamt} Fragen in Kasten 4 oder 5`) : null
  );
}

/**
 * opts:
 *  modus: "einzeln" | "mehrfach"
 *  zusatz(stunde) -> Node | null   (zusätzliche Zeile je Stunde, z. B. letztes Quizergebnis)
 *  onStunde(stunde)                (einzeln: Tipp auf eine Stunde)
 *  ganzeBpe: { aktiv: bool, onStart(bpe) }   (nur einzeln; optional)
 *  auswahl: Set<string>, onAuswahl(set)       (mehrfach)
 */
export function stundenAuswahl(ctx, opts) {
  const boxes = ctx.stand.boxes;
  const wurzel = h("div", { class: "auswahl" });
  const refs = { bpeBoxen: new Map(), stundenBoxen: new Map() };

  const aktualisiere = () => {
    if (opts.modus !== "mehrfach") return;
    for (const b of ctx.daten.bpe) {
      const box = refs.bpeBoxen.get(b.id);
      if (!box) continue;
      const an = b.stunden.filter((s) => opts.auswahl.has(s.id)).length;
      box.checked = an === b.stunden.length && an > 0;
      box.indeterminate = an > 0 && an < b.stunden.length;
    }
    for (const [id, box] of refs.stundenBoxen) box.checked = opts.auswahl.has(id);
  };
  const geaendert = () => {
    aktualisiere();
    opts.onAuswahl(opts.auswahl);
  };

  if (opts.modus === "mehrfach") {
    wurzel.append(
      h(
        "div",
        { class: "auswahl-werkzeuge" },
        h("button", { type: "button", class: "btn-sekundaer btn-klein", onclick: () => { ctx.daten.stunden.forEach((s) => opts.auswahl.add(s.id)); geaendert(); } }, "Alle auswählen"),
        h("button", { type: "button", class: "btn-sekundaer btn-klein", onclick: () => { opts.auswahl.clear(); geaendert(); } }, "Auswahl leeren")
      )
    );
  }

  for (const b of ctx.daten.bpe) {
    const leer = b.stunden.length === 0;
    const karte = h("section", { class: "bpe-karte" + (leer ? " bpe-leer" : ""), "aria-label": `BPE ${b.id}: ${b.titel}` });
    const kopf = bpeKopf(b, { boxes });

    if (opts.modus === "mehrfach" && !leer) {
      const box = h("input", { type: "checkbox", "aria-label": `Alle Stunden der BPE ${b.id} auswählen` });
      box.addEventListener("change", () => {
        for (const s of b.stunden) box.checked ? opts.auswahl.add(s.id) : opts.auswahl.delete(s.id);
        geaendert();
      });
      refs.bpeBoxen.set(b.id, box);
      karte.append(h("label", { class: "bpe-kopf-label" }, box, kopf));
    } else karte.append(kopf);

    if (leer) {
      karte.append(h("p", { class: "noch-nichts" }, "Noch keine Inhalte"));
    } else if (opts.modus === "einzeln" && opts.ganzeBpe && opts.ganzeBpe.aktiv) {
      const n = b.stunden.reduce((a, s) => a + s.fragen.length, 0);
      karte.append(
        h("button", { type: "button", class: "btn-primaer", onclick: () => opts.ganzeBpe.onStart(b) }, `Ganze BPE ${b.id}: Quiz starten`, h("span", { class: "btn-unter" }, `10 Fragen aus ${n}`))
      );
    } else {
      const liste = h("ul", { class: "stunden-liste" });
      for (const s of b.stunden) {
        const fo = fortschritt(s.fragen, boxes);
        const info = h(
          "span",
          { class: "stunde-text" },
          h("span", { class: "stunde-titel" }, s.kurztitel),
          h("span", { class: "stunde-meta" }, `${s.fragen.length} Fragen · Fortschritt ${Math.round(fo.anteil * 100)} %`),
          opts.zusatz ? opts.zusatz(s) : null,
          fortschrittsbalken(fo.anteil, `Lernfortschritt: ${fo.hoch} von ${fo.gesamt} Fragen in Kasten 4 oder 5`)
        );
        if (opts.modus === "mehrfach") {
          const box = h("input", { type: "checkbox" });
          box.checked = opts.auswahl.has(s.id);
          box.addEventListener("change", () => {
            box.checked ? opts.auswahl.add(s.id) : opts.auswahl.delete(s.id);
            geaendert();
          });
          refs.stundenBoxen.set(s.id, box);
          liste.append(h("li", null, h("label", { class: "stunde-zeile" }, box, info)));
        } else {
          liste.append(h("li", null, h("button", { type: "button", class: "stunde-zeile", onclick: () => opts.onStunde(s) }, info, h("span", { class: "pfeil", "aria-hidden": "true" }, "›"))));
        }
      }
      karte.append(liste);
    }
    wurzel.append(karte);
  }
  aktualisiere();
  return wurzel;
}
