import { h, leere, fortschrittsbalken } from "../dom.js";
import { fortschritt, kastenVerteilung } from "../kasten.js";
import { exportiere, parseImport, zusammenfuehren, leererStand, bereinige } from "../store.js";

export function standAnsicht(ctx, el) {
  leere(el);
  const alleFragen = ctx.daten.stunden.flatMap((s) => s.fragen);
  const gesamt = fortschritt(alleFragen, ctx.stand.boxes);
  const verteilung = kastenVerteilung(alleFragen, ctx.stand.boxes);
  const beantwortet = alleFragen.reduce((a, f) => a + (ctx.stand.boxes[f.id] ? ctx.stand.boxes[f.id].richtig + ctx.stand.boxes[f.id].falsch : 0), 0);

  el.append(
    h("p", { class: "hinweis-box" }, "Dein Lernstand liegt nur auf diesem Gerät im Browser. Niemand sonst sieht ihn. Wenn du die Browserdaten löschst oder das Gerät wechselst, ist er weg. Sichere ihn deshalb mit „Exportieren“."),
    h("section", { class: "stand-karte" },
      h("h2", { class: "abschnitt-titel" }, "Gesamt"),
      h("p", null, `${gesamt.hoch} von ${gesamt.gesamt} Fragen sind in Kasten 4 oder 5 (${Math.round(gesamt.anteil * 100)} %). ${beantwortet} Antworten gegeben.`),
      fortschrittsbalken(gesamt.anteil, "Gesamtfortschritt"),
      h("p", { class: "klein muted" }, "Kasten 1 bis 5: " + [1, 2, 3, 4, 5].map((k) => `${verteilung[k]}`).join(" · ")))
  );

  for (const b of ctx.daten.bpe.filter((x) => x.stunden.length)) {
    const sec = h("section", { class: "stand-karte" }, h("h2", { class: "abschnitt-titel" }, `BPE ${b.id}: ${b.titel}`));
    for (const s of b.stunden) {
      const fo = fortschritt(s.fragen, ctx.stand.boxes);
      const q = ctx.stand.quiz[s.id];
      sec.append(h("div", { class: "stand-zeile" }, h("span", { class: "stunde-titel" }, s.kurztitel), h("span", { class: "stunde-meta" }, `Fortschritt ${Math.round(fo.anteil * 100)} % · Quiz: ${q ? `zuletzt ${q.letzt.punkte}/${q.letzt.von}, bestes ${q.best.punkte}/${q.best.von}` : "noch nicht gemacht"}`), fortschrittsbalken(fo.anteil, `Fortschritt ${s.kurztitel}`)));
    }
    el.append(sec);
  }

  const meldung = h("p", { class: "meldung", role: "status" });
  const panel = h("div", { class: "bestaetigung", hidden: true });
  const zeigePanel = (...kinder) => { leere(panel); panel.append(...kinder); panel.hidden = false; panel.scrollIntoView?.({ block: "nearest" }); };
  const schliesse = () => { panel.hidden = true; leere(panel); };

  const datei = h("input", { type: "file", accept: "application/json,.json", hidden: true });
  datei.addEventListener("change", async () => {
    const f = datei.files[0];
    datei.value = "";
    if (!f) return;
    try {
      const neu = parseImport(await f.text());
      const n = Object.keys(neu.boxes).length;
      zeigePanel(
        h("p", null, `Die Datei enthält Lernstand zu ${n} Fragen. Wie soll sie verwendet werden?`),
        h("div", { class: "aktionen" },
          h("button", { type: "button", class: "btn-primaer", onclick: () => { ctx.stand = bereinige(zusammenfuehren(ctx.stand, neu), ctx.gueltige()); ctx.speichern(); standAnsicht(ctx, el); } }, "Zusammenführen (empfohlen)"),
          h("button", { type: "button", class: "btn-gefahr", onclick: () => { ctx.stand = bereinige(neu, ctx.gueltige()); ctx.speichern(); standAnsicht(ctx, el); } }, "Aktuellen Stand ersetzen"),
          h("button", { type: "button", class: "btn-text", onclick: schliesse }, "Abbrechen"))
      );
    } catch (e) {
      meldung.textContent = e.message;
    }
  });

  el.append(
    h("section", { class: "stand-karte" },
      h("h2", { class: "abschnitt-titel" }, "Sichern und wiederherstellen"),
      h("div", { class: "aktionen" },
        h("button", { type: "button", class: "btn-sekundaer", onclick: () => {
          const blob = new Blob([exportiere(ctx.stand)], { type: "application/json" });
          const a = h("a", { href: URL.createObjectURL(blob), download: `ggk-lernstand-${new Date().toISOString().slice(0, 10)}.json` });
          document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        } }, "Exportieren"),
        h("button", { type: "button", class: "btn-sekundaer", onclick: () => datei.click() }, "Importieren"),
        datei,
        h("button", { type: "button", class: "btn-gefahr", onclick: () => zeigePanel(
          h("p", null, "Wirklich den gesamten Lernstand auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden."),
          h("div", { class: "aktionen" },
            h("button", { type: "button", class: "btn-gefahr", onclick: () => { ctx.stand = leererStand(); ctx.speichern(); standAnsicht(ctx, el); } }, "Ja, alles löschen"),
            h("button", { type: "button", class: "btn-text", onclick: schliesse }, "Abbrechen"))) }, "Zurücksetzen")),
      meldung, panel)
  );
  return "Lernstand";
}
