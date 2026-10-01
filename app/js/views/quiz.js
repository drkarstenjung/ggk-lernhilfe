import { h, leere } from "../dom.js";
import { stundenAuswahl } from "./select.js";
import { zeigeFrage, tastenkuerzel } from "./frage.js";
import { quizFuerStunde, quizFuerBpe, prozent } from "../quiz.js";
import { trageQuizEin } from "../store.js";

let ganzeBpeAktiv = false;
let aufraeumen = null;

const datum = (iso) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "");

function startQuiz(ctx, fragen, meta) {
  ctx.lauf = {
    typ: "quiz",
    ...meta,
    fragen,
    i: 0,
    gewaehlt: null,
    ergebnisse: [],
    gespeichert: false,
    kopfzeile: (f) => (f.schwierigkeit === "leicht" ? "leichte Frage" : "anspruchsvollere Frage"),
    onAntwort: (f, korrekt) => {
      const s = ctx.lauf;
      if (s.ergebnisse.length === s.fragen.length && !s.gespeichert) {
        s.gespeichert = true;
        const punkte = s.ergebnisse.filter((x) => x.korrekt).length;
        trageQuizEin(ctx.stand, s.schluessel, punkte, s.fragen.length);
        ctx.speichern();
      }
    },
  };
  ctx.gehe("#/quiz/lauf");
}

export function quizAuswahl(ctx, el) {
  leere(el);
  const hat = ctx.daten.stunden.length > 0;
  el.append(h("p", { class: "muted" }, "Wähle eine Stunde. Du bekommst 10 Fragen mit je 4 Antworten."));
  const box = h("input", { type: "checkbox", id: "ganze-bpe" });
  box.checked = ganzeBpeAktiv;
  box.addEventListener("change", () => { ganzeBpeAktiv = box.checked; quizAuswahl(ctx, el); });
  if (hat) el.append(h("label", { class: "hinweis-box", for: "ganze-bpe" }, box, h("span", null, "Ganze BPE statt einer Stunde (10 Fragen aus allen Stunden der BPE)")));
  el.append(
    stundenAuswahl(ctx, {
      modus: "einzeln",
      zusatz: (s) => {
        const q = ctx.stand.quiz[s.id];
        return q ? h("span", { class: "stunde-meta" }, `Letztes Quiz: ${q.letzt.punkte} von ${q.letzt.von} (${datum(q.letzt.datum)}) · Bestes: ${q.best.punkte} von ${q.best.von}`) : null;
      },
      onStunde: (s) => startQuiz(ctx, quizFuerStunde(s), { schluessel: s.id, stundeIds: [s.id], titel: s.kurztitel }),
      ganzeBpe: {
        aktiv: ganzeBpeAktiv,
        onStart: (b) => startQuiz(ctx, quizFuerBpe(b.stunden), { schluessel: "bpe:" + b.id, stundeIds: b.stunden.map((s) => s.id), titel: `BPE ${b.id}` }),
      },
    })
  );
  return "Quiz";
}

export function quizLauf(ctx, el) {
  const s = ctx.lauf;
  if (!s || s.typ !== "quiz") { ctx.gehe("#/quiz", true); return "Quiz"; }
  if (s.ergebnisse.length === s.fragen.length && s.gewaehlt != null && s.i === s.fragen.length - 1) { /* letzte Frage beantwortet: Rückmeldung zeigen */ }
  zeigeFrage(ctx, el, s, { onFertig: () => ctx.gehe("#/quiz/ergebnis") });
  aufraeumen = tastenkuerzel(el);
  return s.titel;
}

export function quizErgebnis(ctx, el) {
  const s = ctx.lauf;
  if (!s || s.typ !== "quiz" || s.ergebnisse.length < s.fragen.length) { ctx.gehe("#/quiz", true); return "Quiz"; }
  leere(el);
  const punkte = s.ergebnisse.filter((x) => x.korrekt).length;
  const falsch = s.fragen.filter((f) => !s.ergebnisse.find((x) => x.id === f.id).korrekt);
  const p = Math.round(prozent({ punkte, von: s.fragen.length }));
  el.append(
    h("p", { class: "punktzahl", "aria-live": "polite" }, `${punkte} von ${s.fragen.length} richtig`, h("span", { class: "muted" }, ` (${p} %)`)),
    h("p", { class: "muted" }, s.titel)
  );
  if (falsch.length) {
    el.append(h("h2", { class: "abschnitt-titel" }, "Das war falsch"));
    for (const f of falsch) {
      el.append(
        h("div", { class: "falsch-karte" }, h("p", { class: "frage-text klein-text" }, f.frage), h("p", null, h("strong", null, "Richtig: "), f.antworten[f.richtig]), h("p", null, f.erklaerung),
          h("a", { class: "link", href: `#/lesen/${f.stundeId}/${f.lesetext_ref}` }, "Im Lesetext nachlesen"))
      );
    }
  } else el.append(h("p", null, "Alle Fragen richtig. Sehr gut."));

  const stundeFuerLesen = s.stundeIds.length === 1 ? s.stundeIds[0] : null;
  const ueben = [...new Set((falsch.length ? falsch : s.fragen).map((f) => f.stundeId))];
  el.append(
    h(
      "div",
      { class: "aktionen" },
      h("button", { type: "button", class: "btn-primaer", onclick: () => { const alt = ctx.lauf; const fragen = alt.schluessel.startsWith("bpe:") ? quizFuerBpe(alt.stundeIds.map((id) => ctx.daten.stundenById.get(id))) : quizFuerStunde(ctx.daten.stundenById.get(alt.stundeIds[0])); startQuiz(ctx, fragen, { schluessel: alt.schluessel, stundeIds: alt.stundeIds, titel: alt.titel }); } }, "Quiz wiederholen"),
      h("button", { type: "button", class: "btn-sekundaer", onclick: () => { ctx.stand.auswahl = ueben; ctx.speichern(); ctx.gehe("#/lernen"); } }, "Falsche Fragen im Lernmodus üben"),
      stundeFuerLesen ? h("a", { class: "btn-sekundaer", href: `#/lesen/${stundeFuerLesen}` }, "Zum Lesetext") : h("a", { class: "btn-sekundaer", href: "#/lesen" }, "Zu den Lesetexten"),
      h("a", { class: "btn-text", href: "#/" }, "Zur Startseite")
    )
  );
  return "Quiz-Ergebnis";
}

export function quizAufraeumen() {
  if (aufraeumen) { aufraeumen(); aufraeumen = null; }
}
