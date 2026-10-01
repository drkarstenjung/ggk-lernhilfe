// Prüfregeln für Stundendateien. Wird von validate.mjs, build.mjs und den Tests benutzt.
// Alle Meldungen sind auf Deutsch und nennen Datei, Frage-ID und die nötige Änderung.

export const ID_MUSTER = /^[a-z0-9.-]+$/;
const SCHWIERIGKEITEN = ["leicht", "anspruchsvoller"];
const RELEVANZEN = ["kern", "neben"];
const TYPEN = ["sachwissen", "quellenarbeit", "urteilen", "methode"];
const VERBOTENE_FORMELN = [
  /\b(alle|keine)\s+(der\s+|von\s+den\s+)?(oben\s+)?(genannten|aufgeführten|angegebenen|obigen)\b/i,
  /\b(alle|keine)\s+(der\s+)?antworten\b/i,
  /\balle\s+(oben|davor)\b/i,
  /\b(a|b|c|d)\s+und\s+(b|c|d)\s+(sind\s+)?(richtig|korrekt)\b/i,
];

const nichtLeer = (s) => typeof s === "string" && s.trim().length > 0;
const normiere = (s) => String(s).trim().replace(/\s+/g, " ").toLowerCase();

// dateien: [{ datei: "name.json", daten: <geparstes JSON> | null, parseFehler?: string }]
export function pruefe({ bpe, lernhinweise, dateien }) {
  const fehler = [];
  const warnungen = [];
  const bpeMap = new Map((bpe || []).map((b) => [b.id, b]));
  const alleIds = new Map(); // id -> "Datei (Art)"
  const alleFragetexte = new Map();

  const meldeId = (id, datei, art) => {
    if (alleIds.has(id)) {
      fehler.push(`${datei}: Die ID „${id}“ (${art}) kommt auch in „${alleIds.get(id)}“ vor. IDs müssen in allen Dateien eindeutig sein. Bitte eine der beiden ID ändern, falls es sich um verschiedene Inhalte handelt.`);
    } else alleIds.set(id, `${datei}, ${art}`);
  };

  // Allgemeine Lernhinweise
  if (!lernhinweise || typeof lernhinweise !== "object") {
    fehler.push("data/lernhinweise.json: Die Datei fehlt oder ist nicht lesbar.");
  } else {
    for (const s of ["1", "2", "3", "4"]) {
      if (!nichtLeer(lernhinweise.stufen && lernhinweise.stufen[s])) fehler.push(`data/lernhinweise.json: Der allgemeine Hinweis für Stufe ${s} fehlt unter „stufen“.`);
    }
    for (const t of TYPEN) {
      if (!nichtLeer(lernhinweise.typen && lernhinweise.typen[t])) fehler.push(`data/lernhinweise.json: Der Zusatz für den Kompetenztyp „${t}“ fehlt unter „typen“.`);
    }
  }

  for (const { datei, daten, parseFehler } of dateien) {
    const f = (msg) => fehler.push(`${datei}: ${msg}`);
    const w = (msg) => warnungen.push(`${datei}: ${msg}`);

    if (parseFehler || daten == null || typeof daten !== "object" || Array.isArray(daten)) {
      f(`Die Datei ist kein gültiges JSON (${parseFehler || "kein Objekt"}). Häufige Ursachen: ein Komma zu viel oder zu wenig, fehlende Anführungszeichen oder eine nicht geschlossene Klammer.`);
      continue;
    }
    const d = daten;

    if (d.schema_version !== 1) f(`„schema_version“ muss die Zahl 1 sein.`);

    // ID und Dateiname
    const erwarteteId = datei.replace(/^_/, "").replace(/\.json$/, "");
    if (!nichtLeer(d.id)) f(`Das Feld „id“ fehlt oder ist leer.`);
    else {
      if (!ID_MUSTER.test(d.id)) f(`Die ID „${d.id}“ enthält unzulässige Zeichen. Erlaubt sind nur a-z, 0-9, Punkt und Bindestrich (keine Großbuchstaben, Leerzeichen oder Umlaute).`);
      if (d.id !== erwarteteId) f(`Die ID „${d.id}“ passt nicht zum Dateinamen. Die Datei muss „${d.id}.json“ heißen (oder die ID muss „${erwarteteId}“ lauten).`);
      meldeId(d.id, datei, "Stunde");
    }

    // BPE und Jahrgang
    const b = bpeMap.get(d.bpe);
    if (!b) f(`Die BPE „${d.bpe}“ gibt es nicht in data/bpe.json. Erlaubt: ${[...bpeMap.keys()].join(", ")}.`);
    else if (d.jahrgang !== b.jahrgang) f(`Der Jahrgang ${d.jahrgang} passt nicht zur BPE ${d.bpe} (dort: Jahrgang ${b.jahrgang}). Bitte „jahrgang“ auf ${b.jahrgang} ändern.`);
    if (!nichtLeer(d.kurztitel)) f(`Das Feld „kurztitel“ fehlt oder ist leer.`);
    if (!Number.isInteger(d.reihenfolge)) f(`Das Feld „reihenfolge“ muss eine ganze Zahl sein (Position der Stunde innerhalb der BPE).`);

    // Lesetext
    const abschnitte = new Set();
    if (!Array.isArray(d.lesetext) || d.lesetext.length === 0) f(`Der „lesetext“ fehlt oder ist leer. Es wird mindestens ein Abschnitt benötigt.`);
    else {
      d.lesetext.forEach((a, i) => {
        if (!a || !nichtLeer(a.abschnitt_id) || !ID_MUSTER.test(a.abschnitt_id)) f(`Lesetext-Abschnitt ${i + 1}: „abschnitt_id“ fehlt oder enthält unzulässige Zeichen (erlaubt: a-z, 0-9, Punkt, Bindestrich).`);
        else if (abschnitte.has(a.abschnitt_id)) f(`Lesetext-Abschnitt „${a.abschnitt_id}“ kommt doppelt vor. Jede abschnitt_id darf nur einmal vorkommen.`);
        else abschnitte.add(a.abschnitt_id);
        if (a && !nichtLeer(a.ueberschrift)) f(`Lesetext-Abschnitt „${a && a.abschnitt_id}“: „ueberschrift“ fehlt.`);
        if (a && !nichtLeer(a.text_md)) f(`Lesetext-Abschnitt „${a && a.abschnitt_id}“: „text_md“ fehlt oder ist leer.`);
      });
    }

    // Fragen
    const fragen = Array.isArray(d.fragen) ? d.fragen : null;
    if (!fragen) f(`Das Feld „fragen“ fehlt oder ist keine Liste.`);
    else {
      if (fragen.length !== 10) f(`Es sind ${fragen.length} Fragen vorhanden, es müssen genau 10 sein.`);
      let leicht = 0, kern = 0, laengste = 0;
      fragen.forEach((q, i) => {
        const nr = `Frage ${i + 1}`;
        const qid = q && nichtLeer(q.id) ? q.id : null;
        const name = qid ? `Frage „${qid}“` : nr;
        const fq = (msg) => f(`${name}: ${msg}`);
        if (!q || typeof q !== "object") return f(`${nr}: ist kein gültiger Eintrag.`);
        if (!qid) fq(`„id“ fehlt.`);
        else {
          if (!ID_MUSTER.test(qid)) fq(`Die ID enthält unzulässige Zeichen (erlaubt: a-z, 0-9, Punkt, Bindestrich).`);
          if (nichtLeer(d.id) && !qid.startsWith(d.id + "-")) fq(`Die ID muss mit der Stunden-ID „${d.id}-“ beginnen (z. B. „${d.id}-q01“).`);
          meldeId(qid, datei, "Frage");
        }
        if (!nichtLeer(q.frage)) fq(`„frage“ fehlt oder ist leer.`);
        else {
          const key = normiere(q.frage);
          if (alleFragetexte.has(key)) fq(`Der Fragetext kommt schon in „${alleFragetexte.get(key)}“ vor. Fragetexte dürfen nicht doppelt vorkommen.`);
          else alleFragetexte.set(key, `${datei}, ${qid || nr}`);
        }
        const a = q.antworten;
        let antwortenOk = false;
        if (!Array.isArray(a) || a.length !== 4) fq(`Es müssen genau 4 Antworten vorhanden sein.`);
        else if (!a.every(nichtLeer)) fq(`Mindestens eine der 4 Antworten ist leer.`);
        else if (new Set(a.map(normiere)).size !== 4) fq(`Zwei Antworten sind gleich. Alle 4 Antworten müssen sich unterscheiden.`);
        else antwortenOk = true;
        if (Array.isArray(a)) {
          for (const t of a) if (typeof t === "string" && VERBOTENE_FORMELN.some((re) => re.test(t))) fq(`Die Antwort „${t}“ nutzt eine verbotene Formel wie „alle genannten“ oder „keine der genannten“. Bitte umformulieren.`);
        }
        if (!Number.isInteger(q.richtig) || q.richtig < 0 || q.richtig > 3) fq(`„richtig“ muss eine Zahl von 0 bis 3 sein (0 = erste Antwort).`);
        if (!SCHWIERIGKEITEN.includes(q.schwierigkeit)) fq(`„schwierigkeit“ muss „leicht“ oder „anspruchsvoller“ sein.`);
        if (!RELEVANZEN.includes(q.relevanz)) fq(`„relevanz“ muss „kern“ oder „neben“ sein.`);
        if (!nichtLeer(q.erklaerung)) fq(`„erklaerung“ fehlt oder ist leer.`);
        if (!nichtLeer(q.lesetext_ref) || !abschnitte.has(q.lesetext_ref)) fq(`„lesetext_ref“ („${q.lesetext_ref}“) zeigt auf keinen vorhandenen Lesetext-Abschnitt. Vorhanden: ${[...abschnitte].join(", ") || "keine"}.`);
        if (q.schwierigkeit === "leicht") leicht++;
        if (q.relevanz === "kern") kern++;
        if (antwortenOk && Number.isInteger(q.richtig) && q.richtig >= 0 && q.richtig <= 3) {
          const laengen = a.map((t) => t.trim().length);
          const max = Math.max(...laengen);
          if (laengen[q.richtig] === max && laengen.filter((l) => l === max).length === 1) laengste++;
        }
      });
      if (fragen.length === 10) {
        if (leicht !== 3) f(`Es sind ${leicht} leichte und ${10 - leicht} anspruchsvollere Fragen. Verlangt sind genau 3 leichte und 7 anspruchsvollere.`);
        if (kern !== 8) f(`Es sind ${kern} Kern- und ${10 - kern} Nebenfragen. Verlangt sind genau 8 Kern- und 2 Nebenfragen.`);
      }
      if (laengste > 5) w(`WARNUNG: Bei ${laengste} von 10 Fragen ist die richtige Antwort die längste. Das verrät die Lösung. Bitte einzelne falsche Antworten ausführlicher oder richtige Antworten kürzer formulieren.`);
    }

    // Kompetenzen
    if (!Array.isArray(d.kompetenzen) || d.kompetenzen.length < 3 || d.kompetenzen.length > 4) {
      f(`Es sind ${Array.isArray(d.kompetenzen) ? d.kompetenzen.length : 0} Kompetenzen vorhanden, es müssen 3 oder 4 sein.`);
    }
    if (Array.isArray(d.kompetenzen)) {
      d.kompetenzen.forEach((k, i) => {
        const kid = k && nichtLeer(k.id) ? k.id : null;
        const name = kid ? `Kompetenz „${kid}“` : `Kompetenz ${i + 1}`;
        const fk = (msg) => f(`${name}: ${msg}`);
        if (!k || typeof k !== "object") return f(`${name} ist kein gültiger Eintrag.`);
        if (!kid) fk(`„id“ fehlt.`);
        else {
          if (!ID_MUSTER.test(kid)) fk(`Die ID enthält unzulässige Zeichen (erlaubt: a-z, 0-9, Punkt, Bindestrich).`);
          if (nichtLeer(d.id) && !kid.startsWith(d.id + "-")) fk(`Die ID muss mit der Stunden-ID „${d.id}-“ beginnen (z. B. „${d.id}-k1“).`);
          meldeId(kid, datei, "Kompetenz");
        }
        if (!nichtLeer(k.kann_aussage)) fk(`„kann_aussage“ fehlt oder ist leer.`);
        if (!TYPEN.includes(k.typ)) fk(`„typ“ muss einer von ${TYPEN.join(", ")} sein.`);
        for (const s of ["1", "2", "3", "4"]) if (!k.lernhinweise || !nichtLeer(k.lernhinweise[s])) fk(`Der Lernhinweis für Stufe ${s} fehlt unter „lernhinweise“.`);
        if (!nichtLeer(k.lesetext_ref) || !abschnitte.has(k.lesetext_ref)) fk(`„lesetext_ref“ („${k.lesetext_ref}“) zeigt auf keinen vorhandenen Lesetext-Abschnitt. Vorhanden: ${[...abschnitte].join(", ") || "keine"}.`);
      });
    }
  }
  return { fehler, warnungen };
}
