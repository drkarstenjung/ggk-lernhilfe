// Kleiner, sicherer Markdown-Renderer. HTML in den Daten wird immer escaped.
// Unterstützt: Absätze, Zwischenüberschriften (#, ##, ###), **fett**, *kursiv*, Listen (- / * / 1.).

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  return s;
}

export function renderMarkdown(md) {
  const zeilen = String(md || "").replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let absatz = [];
  let liste = null; // { typ: "ul" | "ol", items: [] }

  const flushAbsatz = () => {
    if (absatz.length) html.push(`<p>${inline(absatz.join(" "))}</p>`);
    absatz = [];
  };
  const flushListe = () => {
    if (liste) {
      html.push(`<${liste.typ}>${liste.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${liste.typ}>`);
      liste = null;
    }
  };

  for (const roh of zeilen) {
    const zeile = roh.trimEnd();
    let m;
    if (!zeile.trim()) {
      flushAbsatz();
      flushListe();
    } else if ((m = /^(#{1,3})\s+(.*)$/.exec(zeile))) {
      flushAbsatz();
      flushListe();
      const ebene = m[1].length + 2; // # -> h3, ## -> h4, ### -> h5
      html.push(`<h${ebene}>${inline(m[2])}</h${ebene}>`);
    } else if ((m = /^\s*[-*]\s+(.*)$/.exec(zeile))) {
      flushAbsatz();
      if (!liste || liste.typ !== "ul") {
        flushListe();
        liste = { typ: "ul", items: [] };
      }
      liste.items.push(m[1]);
    } else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(zeile))) {
      flushAbsatz();
      if (!liste || liste.typ !== "ol") {
        flushListe();
        liste = { typ: "ol", items: [] };
      }
      liste.items.push(m[1]);
    } else {
      flushListe();
      absatz.push(zeile.trim());
    }
  }
  flushAbsatz();
  flushListe();
  return html.join("\n");
}
