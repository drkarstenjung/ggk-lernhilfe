// Gemeinsame Fragenanzeige für Quiz und Lernmodus (Zustand liegt in der Session, damit
// man nach dem Nachlesen im Lesetext genau dort weitermachen kann).
import { h, icon, leere, fortschrittsbalken } from "../dom.js";

const BUCHSTABEN = ["A", "B", "C", "D"];

// session: { fragen, i, gewaehlt, ergebnisse, onAntwort(frage, korrekt), kopfzeile? }
export function zeigeFrage(ctx, el, session, { onFertig }) {
  leere(el);
  const f = session.fragen[session.i];
  const n = session.fragen.length;
  const beantwortet = session.gewaehlt != null;
  const stunde = ctx.daten.stundenById.get(f.stundeId);

  const antwort = (idx) => {
    if (session.gewaehlt != null) return;
    session.gewaehlt = idx;
    const korrekt = idx === f.richtig;
    session.ergebnisse.push({ id: f.id, korrekt });
    session.onAntwort(f, korrekt);
    zeigeFrage(ctx, el, session, { onFertig });
    const weiter = el.querySelector("[data-weiter]");
    if (weiter) weiter.focus();
  };

  const optionen = h("div", { class: "optionen", role: "group", "aria-label": "Antwortmöglichkeiten" });
  f.antworten.forEach((text, idx) => {
    const klassen = ["option"];
    let marker = null;
    if (beantwortet) {
      if (idx === f.richtig) { klassen.push("richtig"); marker = icon("richtig", 20); }
      else if (idx === session.gewaehlt) { klassen.push("falsch"); marker = icon("falsch", 20); }
    }
    optionen.append(
      h(
        "button",
        { type: "button", class: klassen.join(" "), disabled: beantwortet || null, "aria-keyshortcuts": String(idx + 1), onclick: () => antwort(idx) },
        h("span", { class: "option-buchstabe", "aria-hidden": "true" }, BUCHSTABEN[idx]),
        h("span", { class: "option-text" }, text),
        marker ? h("span", { class: "option-marker" }, marker) : null,
        beantwortet && idx === f.richtig ? h("span", { class: "sr-only" }, " (richtige Antwort)") : null,
        beantwortet && idx === session.gewaehlt && idx !== f.richtig ? h("span", { class: "sr-only" }, " (deine Antwort, falsch)") : null
      )
    );
  });

  el.append(
    h("div", { class: "frage-kopf" }, h("span", { class: "muted" }, `Frage ${session.i + 1} von ${n}`), session.kopfzeile ? h("span", { class: "muted klein" }, session.kopfzeile(f)) : null),
    fortschrittsbalken(session.i / n, `Fortschritt: Frage ${session.i + 1} von ${n}`),
    stunde && session.zeigeStunde ? h("p", { class: "klein muted frage-stunde" }, stunde.kurztitel) : null,
    h("h2", { class: "frage-text" }, f.frage),
    optionen
  );

  if (beantwortet) {
    const korrekt = session.gewaehlt === f.richtig;
    el.append(
      h(
        "div",
        { class: "rueckmeldung " + (korrekt ? "richtig" : "falsch"), role: "status" },
        h("p", { class: "rueckmeldung-status" }, icon(korrekt ? "richtig" : "falsch", 22), korrekt ? " Richtig." : " Leider falsch."),
        korrekt ? null : h("p", null, h("strong", null, "Richtig ist: "), f.antworten[f.richtig]),
        h("p", null, f.erklaerung),
        h("a", { class: "link", href: `#/lesen/${f.stundeId}/${f.lesetext_ref}` }, "Im Lesetext nachlesen")
      ),
      h(
        "button",
        { type: "button", class: "btn-primaer", "data-weiter": "1", onclick: () => (session.i < n - 1 ? (session.i++, (session.gewaehlt = null), zeigeFrage(ctx, el, session, { onFertig }), el.scrollIntoView?.({ block: "start" })) : onFertig()) },
        session.i < n - 1 ? "Weiter" : "Zur Auswertung"
      )
    );
  }
}

// Tastenkürzel 1 bis 4 für die Antworten, Enter/Leertaste auf „Weiter“ läuft über den Button selbst.
export function tastenkuerzel(el) {
  const handler = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!["1", "2", "3", "4"].includes(e.key)) return;
    const knoepfe = el.querySelectorAll(".option");
    const k = knoepfe[Number(e.key) - 1];
    if (k && !k.disabled) { e.preventDefault(); k.click(); }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
