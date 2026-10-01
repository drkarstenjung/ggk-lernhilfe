// Kleine DOM-Hilfen. Texte werden immer als Text gesetzt (nie als HTML).

export function h(tag, attrs, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  anhaengen(el, kinder);
  return el;
}

function anhaengen(el, kinder) {
  for (const k of kinder) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) anhaengen(el, k);
    else el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
}

// Schlichte Inline-SVG-Icons (feste, interne Pfade).
const PFADE = {
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  lernen: '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/><path d="M7 11h6M7 14h4"/>',
  kompetenz: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  lesen: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/><path d="M8 7h8M8 11h6"/>',
  stand: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6" fill="currentColor"/>',
  zurueck: '<path d="M15 5l-7 7 7 7"/>',
  weiter: '<path d="M9 5l7 7-7 7"/>',
  richtig: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  falsch: '<path d="M6 6l12 12M18 6L6 18"/>',
};

export function icon(name, groesse = 24) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", groesse);
  svg.setAttribute("height", groesse);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.innerHTML = PFADE[name] || "";
  return svg;
}

export function leere(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function fortschrittsbalken(anteil, beschriftung) {
  const prozent = Math.round(anteil * 100);
  return h(
    "div",
    { class: "balken", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(prozent), "aria-label": beschriftung },
    h("div", { class: "balken-fuellung", style: `width:${prozent}%` })
  );
}
