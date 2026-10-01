import { h, leere } from "../dom.js";
import { stundenAuswahl } from "./select.js";
import { SKALA } from "../config.js";
import { mittelwert, ampel, AMPEL_TEXT, sollIst, lernhinweis } from "../kompetenz.js";

const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "");
const dez = (x) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function ampelPunkt(mw) {
  const a = ampel(mw);
  return h("span", { class: "ampel ampel-" + (a || "keine") }, h("span", { class: "ampel-punkt", "aria-hidden": "true" }), a ? `${AMPEL_TEXT[a]} (Ø ${dez(mw)})` : "noch nicht eingeschätzt");
}

export function checkAuswahl(ctx, el) {
  leere(el);
  el.append(
    h("p", { class: "muted" }, "Wähle eine Stunde und schätze ein, wie sicher du bist. Die Ampel zeigt deine letzte Einschätzung (Mittelwert der Kann-Aussagen)."),
    stundenAuswahl(ctx, {
      modus: "einzeln",
      zusatz: (s) => {
        const mw = mittelwert(s, ctx.stand.selbst);
        const letzte = s.kompetenzen.map((k) => ctx.stand.selbst[k.id]?.datum).filter(Boolean).sort().pop();
        return h("span", { class: "stunde-meta" }, ampelPunkt(mw), letzte ? ` · ${datum(letzte)}` : "");
      },
      onStunde: (s) => ctx.gehe(`#/check/${s.id}`),
    })
  );
  return "Kompetenzcheck";
}

export function checkStunde(ctx, el, stundeId) {
  const s = ctx.daten.stundenById.get(stundeId);
  if (!s) { ctx.gehe("#/check", true); return "Kompetenzcheck"; }
  leere(el);
  const werte = {};
  s.kompetenzen.forEach((k) => { const alt = ctx.stand.selbst[k.id]; if (alt) werte[k.id] = alt.stufe; });
  const hatAlt = Object.keys(werte).length > 0;

  el.append(h("p", { class: "muted" }, s.kurztitel), h("p", null, "Wie sicher bist du bei diesen Aussagen?"));
  if (hatAlt) el.append(h("p", { class: "klein muted" }, "Deine letzte Einschätzung ist vorausgewählt. Du kannst sie ändern."));
  const sendeKnopf = h("button", { type: "button", class: "btn-primaer", onclick: auswerten }, "Einschätzung speichern");
  const pruefe = () => { sendeKnopf.disabled = !s.kompetenzen.every((k) => werte[k.id]); };

  const form = h("form", { class: "check-form", onsubmit: (e) => e.preventDefault() });
  for (const k of s.kompetenzen) {
    const gruppe = h("fieldset", { class: "kann" }, h("legend", null, k.kann_aussage));
    const skala = h("div", { class: "skala" });
    for (const st of SKALA) {
      const radio = h("input", { type: "radio", name: k.id, value: String(st.wert) });
      radio.checked = werte[k.id] === st.wert;
      radio.addEventListener("change", () => { werte[k.id] = st.wert; pruefe(); });
      skala.append(h("label", { class: "skala-feld" }, radio, h("span", { class: "skala-zahl" }, String(st.wert)), h("span", { class: "skala-text" }, st.label)));
    }
    gruppe.append(skala);
    form.append(gruppe);
  }
  el.append(form, sendeKnopf);
  pruefe();

  function auswerten() {
    const jetzt = new Date().toISOString();
    for (const k of s.kompetenzen) ctx.stand.selbst[k.id] = { stufe: werte[k.id], datum: jetzt };
    ctx.speichern();
    ergebnis();
  }

  function ergebnis() {
    leere(el);
    const mw = mittelwert(s, ctx.stand.selbst);
    el.append(h("p", { class: "muted" }, s.kurztitel), h("p", null, "Deine Einschätzung: ", ampelPunkt(mw)));
    const si = sollIst(mw, ctx.stand.quiz[s.id]?.letzt);
    if (si) el.append(h("div", { class: "hinweis-box hinweis-sollist", role: "status" }, si));
    for (const k of s.kompetenzen) {
      const stufe = ctx.stand.selbst[k.id].stufe;
      const lh = lernhinweis(k, stufe, ctx.daten.lernhinweise);
      el.append(
        h("section", { class: "hinweis-karte" },
          h("h2", { class: "kann-titel" }, k.kann_aussage),
          h("p", { class: "klein muted" }, `Deine Einschätzung: ${stufe} (${SKALA[stufe - 1].label})`),
          lh.spezifisch ? h("p", null, lh.spezifisch) : null,
          lh.allgemein ? h("p", null, lh.allgemein) : null,
          lh.typ ? h("p", { class: "typ-hinweis" }, lh.typ) : null,
          h("a", { class: "link", href: `#/lesen/${s.id}/${k.lesetext_ref}` }, "Im Lesetext nachlesen"))
      );
    }
    el.append(
      h("div", { class: "aktionen" },
        h("button", { type: "button", class: "btn-primaer", onclick: () => { ctx.stand.auswahl = [s.id]; ctx.speichern(); ctx.gehe("#/lernen"); } }, "Fragen dieser Stunde üben"),
        h("a", { class: "btn-sekundaer", href: `#/check/${s.id}`, onclick: (e) => { e.preventDefault(); checkStunde(ctx, el, s.id); } }, "Einschätzung wiederholen"),
        h("a", { class: "btn-text", href: "#/check" }, "Zurück zur Auswahl"))
    );
    el.scrollIntoView?.({ block: "start" });
  }
  return "Kompetenzcheck";
}
