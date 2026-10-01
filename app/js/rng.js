// Zufallshilfen. Alle Funktionen nehmen optional eine eigene Zufallsquelle (für Tests).

export function shuffle(liste, rng = Math.random) {
  const a = liste.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministische Zufallsquelle für Tests.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mischt die Antwortpositionen einer Frage und führt den Index der richtigen Antwort mit.
export function mischeAntworten(frage, rng = Math.random) {
  const reihenfolge = shuffle(frage.antworten.map((_, i) => i), rng);
  return {
    ...frage,
    antworten: reihenfolge.map((i) => frage.antworten[i]),
    richtig: reihenfolge.indexOf(frage.richtig),
  };
}
