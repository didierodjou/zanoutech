// app/students/utils/constants.ts
export const PUNISHMENT_REASONS = [
  "Retards répétés",
  "Absence injustifiée",
  "Comportement perturbateur en classe",
  "Non-respect du règlement intérieur",
  "Devoir non rendu",
  "Insolence envers un professeur",
  "Tricherie lors d'un contrôle",
  "Utilisation du téléphone en cours",
  "Bruit excessif",
  "Dégradation de matériel",
];

export const calculateWeightedAverage = (devoir: number, interrogations: number[]): number => {
  if (!devoir && (!interrogations || interrogations.length === 0)) return 0;
  const interroAvg = interrogations?.length > 0
    ? interrogations.reduce((a, b) => a + b, 0) / interrogations.length
    : 0;
  if (devoir && interrogations?.length > 0) {
    return Number(((devoir * 2 + interroAvg) / 3).toFixed(2));
  } else if (devoir) {
    return Number(devoir.toFixed(2));
  } else {
    return Number(interroAvg.toFixed(2));
  }
};