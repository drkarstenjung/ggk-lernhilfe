import { h, leere } from "../dom.js";
import { renderMarkdown } from "../markdown.js";

export function lesenListe(ctx, el) {
  leere(el);
  el.append(h("p", { class: "muted" }, "Hier kannst du die Lesetexte zu den Stunden nachlesen."));
  for (const b of ctx.daten.bpe) {
    const karte = h("section", { class: "bpe-karte" + (b.stunden.length ? "" : " bpe-leer") },
      h("div", { class: "bpe-kopf" }, h("div", { class: "bpe-titelzeile" }, h("span", { class: "label-jahr" }, `Kl. ${b.jahrgang}`), h("span", { class: "bpe-nr" }, `BPE ${b.id}`)), h("div", { class: "bpe-titel" }, b.titel)));
    if (!b.stunden.length) karte.append(h("p", { class: "noch-nichts" }, "Noch keine Inhalte"));
    else karte.append(h("ul", { class: "stunden-liste" }, b.stunden.map((s) => h("li", null, h("a", { class: "stunde-zeile", href: `#/lesen/${s.id}` }, h("span", { class: "stunde-text" }, h("span", { class: "stunde-titel" }, s.kurztitel)), h("span", { class: "pfeil", "aria-hidden": "true" }, "›"))))));
    el.append(karte);
  }
  return "Lesetexte";
}

export function lesenStunde(ctx, el, stundeId, abschnittId) {
  const s = ctx.daten.stundenById.get(stundeId);
  if (!s) { ctx.gehe("#/lesen", true); return "Lesetexte"; }
  leere(el);
  const b = ctx.daten.bpe.find((x) => x.id === s.bpe);
  el.append(h("p", { class: "muted" }, `Kl. ${s.jahrgang} · BPE ${s.bpe}${b ? ": " + b.titel : ""}`), h("h2", { class: "lese-titel" }, s.kurztitel));
  if (s.lesetext.length > 1) {
    el.append(h("nav", { class: "inhalt", "aria-label": "Abschnitte" }, s.lesetext.map((a) => h("a", { href: `#/lesen/${s.id}/${a.abschnitt_id}` }, a.ueberschrift))));
  }
  for (const a of s.lesetext) {
    const sec = h("section", { class: "lese-abschnitt", id: `abschnitt-${a.abschnitt_id}`, tabindex: "-1" }, h("h3", null, a.ueberschrift));
    const body = h("div", { class: "lese-text" });
    body.innerHTML = renderMarkdown(a.text_md); // Renderer escaped alles HTML aus den Daten
    sec.append(body);
    el.append(sec);
  }
  el.append(h("div", { class: "aktionen" },
    h("button", { type: "button", class: "btn-sekundaer", onclick: () => ctx.zurueck("#/lesen") }, "Zurück zur vorherigen Ansicht"),
    h("button", { type: "button", class: "btn-primaer", onclick: () => ctx.gehe("#/quiz") }, "Zum Quiz")));
  if (abschnittId) {
    const ziel = el.querySelector(`#abschnitt-${CSS.escape(abschnittId)}`);
    if (ziel) {
      ziel.classList.add("hervorgehoben");
      requestAnimationFrame(() => { ziel.scrollIntoView({ block: "start" }); ziel.focus({ preventScroll: true }); });
    }
  }
  return s.kurztitel;
}
