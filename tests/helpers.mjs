// Erzeugt gültige Stundendaten für Tests und Beispieldateien.
export function baueStunde({ id, bpe = "1.1", jahrgang = 11, titel = "Testthema", reihenfolge = 1, platzhalter = true } = {}) {
  const fragen = [];
  for (let i = 1; i <= 10; i++) {
    const nr = String(i).padStart(2, "0");
    const leicht = i <= 3;
    const neben = i >= 9;
    const richtig = (i - 1) % 4;
    const antworten = ["A", "B", "C", "D"].map((x, k) =>
      k === richtig ? `Richtige Antwort zu Frage ${i} (${x})` : `Falsche Antwort ${x} zu Frage ${i}, ${k}`
    );
    fragen.push({
      id: `${id}-q${nr}`,
      frage: platzhalter ? `Platzhalterfrage ${i} zu ${titel}: Welche Antwort ist richtig?` : `Frage ${i} zu ${titel}`,
      antworten,
      richtig,
      schwierigkeit: leicht ? "leicht" : "anspruchsvoller",
      relevanz: neben ? "neben" : "kern",
      erklaerung: `Erklärung zu Frage ${i}: Hier steht in ein bis zwei Sätzen, warum die richtige Antwort stimmt.`,
      lesetext_ref: i % 2 ? "a1" : "a2",
    });
  }
  const kompetenzen = [1, 2, 3].map((n) => ({
    id: `${id}-k${n}`,
    kann_aussage: `Ich kann Platzhalter-Aussage ${n} zu ${titel} erklären.`,
    typ: ["sachwissen", "quellenarbeit", "urteilen"][n - 1],
    lernhinweise: {
      1: `Hinweis (Stufe 1) zu Kompetenz ${n}.`,
      2: `Hinweis (Stufe 2) zu Kompetenz ${n}.`,
      3: `Hinweis (Stufe 3) zu Kompetenz ${n}.`,
      4: `Hinweis (Stufe 4) zu Kompetenz ${n}.`,
    },
    lesetext_ref: n === 2 ? "a2" : "a1",
  }));
  return {
    schema_version: 1,
    id,
    jahrgang,
    bpe,
    kurztitel: titel,
    reihenfolge,
    lesetext: [
      {
        abschnitt_id: "a1",
        ueberschrift: "Erster Abschnitt",
        text_md: `Dies ist ein **Platzhaltertext** zu ${titel}. Hier steht später der echte Lesetext.\n\nEin zweiter Absatz mit *Betonung* und <b>HTML, das nicht interpretiert wird</b>.\n\n- Erster Listenpunkt\n- Zweiter Listenpunkt`,
      },
      {
        abschnitt_id: "a2",
        ueberschrift: "Zweiter Abschnitt",
        text_md: `### Zwischenüberschrift\n\nWeiterer Platzhaltertext zu ${titel}.\n\n1. Erster Schritt\n2. Zweiter Schritt`,
      },
    ],
    fragen,
    kompetenzen,
  };
}
