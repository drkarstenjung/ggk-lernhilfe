import { h, icon, leere } from "../dom.js";

export function startAnsicht(ctx, el) {
  leere(el);
  const kachel = (href, ico, titel, text) =>
    h("a", { class: "kachel", href }, h("span", { class: "kachel-icon" }, icon(ico, 34)), h("span", { class: "kachel-text" }, h("span", { class: "kachel-titel" }, titel), h("span", { class: "kachel-unter" }, text)), h("span", { class: "pfeil", "aria-hidden": "true" }, "›"));
  const sek = (href, ico, text) => h("a", { class: "sek-link", href }, icon(ico, 22), h("span", null, text));
  el.append(
    h("p", { class: "muted center start-text" }, "Geschichte mit Gemeinschaftskunde"),
    h("div", { class: "kacheln" },
      kachel("#/quiz", "quiz", "Quiz", "10 Fragen zu einer Stunde oder BPE"),
      kachel("#/lernen", "lernen", "Lernmodus", "Fragen aus mehreren Stunden, adaptiv"),
      kachel("#/check", "kompetenz", "Kompetenzcheck", "Schätze dich ein, bekomme Lerntipps")),
    h("div", { class: "sek-liste" }, sek("#/lesen", "lesen", "Lesetexte"), sek("#/stand", "stand", "Lernstand"), sek("#/info", "info", "Info")),
    ctx.daten.stunden.length === 0 ? h("p", { class: "hinweis-box" }, "Es sind noch keine Stunden veröffentlicht.") : null
  );
  return "GGK-Lernhilfe";
}
