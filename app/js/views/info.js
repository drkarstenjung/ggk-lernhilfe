import { h, leere } from "../dom.js";

export function infoAnsicht(ctx, el) {
  leere(el);
  el.append(
    h("section", { class: "info-block" }, h("h2", { class: "abschnitt-titel" }, "Über diese App"),
      h("p", null, "Die GGK-Lernhilfe unterstützt dich beim Lernen im Fach Geschichte mit Gemeinschaftskunde am Beruflichen Gymnasium. Sie trainiert vor allem Fakten, Begriffe, Daten, Personen und einfache Zusammenhänge."),
      h("ul", null, h("li", null, h("strong", null, "Quiz: "), "10 Fragen zu einer Stunde oder einer ganzen BPE."), h("li", null, h("strong", null, "Lernmodus: "), "Fragen aus mehreren Stunden, die sich nach deinem Wissensstand richten (5 Kästen)."), h("li", null, h("strong", null, "Kompetenzcheck: "), "Du schätzt dich ein und bekommst Lerntipps."), h("li", null, h("strong", null, "Lesetexte: "), "zum Nachlesen."))),
    h("section", { class: "info-block" }, h("h2", { class: "abschnitt-titel" }, "Datenschutz"),
      h("p", null, "Die App kommt ohne Konto aus. Dein Lernstand wird ausschließlich im Speicher deines Browsers auf diesem Gerät abgelegt (localStorage). Es gibt keine Cookies, kein Tracking und keine Anfragen an andere Server. Bei gelöschten Browserdaten geht der Lernstand verloren; mit Export und Import unter „Lernstand“ kannst du ihn selbst sichern."),
      h("p", { class: "klein muted" }, "Die App wird über GitHub Pages ausgeliefert. Beim Aufruf der Seite verarbeitet GitHub technisch notwendige Verbindungsdaten (z. B. IP-Adresse). Genaueres steht in der Datenschutzerklärung von GitHub.")),
    h("section", { class: "info-block" }, h("h2", { class: "abschnitt-titel" }, "Impressum"),
      h("p", null, "Verantwortlich: Dr. Karsten Jung"),
      h("p", null, "Justus-von-Liebig-Schule Waldshut", h("br"), "Von-Kilian-Str. 5", h("br"), "79761 Waldshut"),
      h("p", null, "E-Mail: ", h("a", { class: "link", href: "mailto:karsten.jung@jls-wt.de" }, "karsten.jung@jls-wt.de"))),
    h("section", { class: "info-block" }, h("h2", { class: "abschnitt-titel" }, "Version"),
      h("p", { class: "klein muted" }, `Inhaltsstand: ${ctx.daten.version} · ${ctx.daten.stunden.length} Stunde(n)`))
  );
  return "Info";
}
