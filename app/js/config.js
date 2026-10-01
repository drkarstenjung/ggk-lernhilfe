// Konfiguration und Schwellenwerte der GGK-Lernhilfe.

export const STORAGE_KEY = "ggk-lernhilfe:v1";
export const META_KEY = "ggk-lernhilfe:meta";
export const STAND_SCHEMA_VERSION = 1;

// Lernmodus
export const RUNDE_GROESSE = 10;
export const KASTEN_MAX = 5;
export const KASTEN_GEWICHTE = { 1: 8, 2: 5, 3: 3, 4: 2, 5: 1 };
export const FORTSCHRITT_AB_KASTEN = 4; // Fortschrittsbalken: Anteil in Kasten 4 und 5
export const GESICHERT_KASTEN = 5;

// Quiz
export const QUIZ = { anzahl: 10, leicht: 3, anspruchsvoller: 7, kern: 8, neben: 2 };

// Kompetenzcheck: Soll-Ist-Vergleich (Mittelwert der Skala 1 bis 4, Quiz in Prozent)
export const SOLL_IST = {
  sicherMax: 2.0,
  quizNiedrig: 60,
  unsicherMin: 3.0,
  quizHoch: 80,
};
export const SOLL_IST_TEXTE = {
  unstimmigKeinWissen:
    "Deine Einschätzung und dein Quizergebnis passen nicht ganz zusammen. Sieh dir die falsch beantworteten Fragen noch einmal an und prüfe, wo die Lücken liegen.",
  zuBescheiden: "Dein Quizergebnis ist besser als deine Einschätzung. Du kannst dir mehr zutrauen.",
  keinQuiz: "Mach das Quiz zu dieser Stunde, um deine Einschätzung zu überprüfen.",
};

// Ampel aus dem Mittelwert der Einschätzung
export const AMPEL = { gruenMax: 1.75, gelbMax: 2.75 };

export const SKALA = [
  { wert: 1, label: "sehr sicher" },
  { wert: 2, label: "eher sicher" },
  { wert: 3, label: "eher unsicher" },
  { wert: 4, label: "unsicher" },
];
