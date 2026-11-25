/**
 * Sample curriculum templates.
 *
 * WARNING: these are EXAMPLES to edit, NOT official curricula. Subject names
 * are inspired by a first-semester BUT GEA (Gestion des entreprises et des
 * administrations) but the coefficients are made up, and the real programme
 * attaches each course to several UEs with different weights, which Revio
 * simplifies to one UE per subject. Each student must check against the
 * curriculum ("maquette") published by their own IUT.
 */

export type TemplateSubject = {
  name: string;
  teachingUnit: string;
  coefficient: number;
  color: string;
};

export type CurriculumTemplate = {
  key: string;
  label: string;
  semester: string;
  disclaimer: string;
  subjects: readonly TemplateSubject[];
};

const UE1 = "UE 1 · Analyser";
const UE2 = "UE 2 · Aider à décider";
const UE3 = "UE 3 · Piloter les relations";

export const BUT_GEA_S1: CurriculumTemplate = {
  key: "but-gea-s1",
  label: "Exemple BUT GEA, semestre 1",
  semester: "S1",
  disclaimer:
    "Exemple simplifié inspiré d'un BUT GEA : coefficients fictifs, une seule UE par matière. Vérifie et corrige avec la maquette de ton IUT.",
  subjects: [
    { name: "Fondamentaux du management", teachingUnit: UE1, coefficient: 3, color: "#2563eb" },
    { name: "Environnement économique", teachingUnit: UE1, coefficient: 3, color: "#0891b2" },
    { name: "Introduction au droit", teachingUnit: UE1, coefficient: 2, color: "#4f46e5" },
    { name: "SAÉ · Analyse d'une organisation", teachingUnit: UE1, coefficient: 4, color: "#7c3aed" },
    { name: "Initiation à la comptabilité", teachingUnit: UE2, coefficient: 4, color: "#059669" },
    { name: "Mathématiques et statistiques", teachingUnit: UE2, coefficient: 3, color: "#16a34a" },
    { name: "Outils numériques", teachingUnit: UE2, coefficient: 2, color: "#65a30d" },
    { name: "SAÉ · Aide à la décision", teachingUnit: UE2, coefficient: 4, color: "#ca8a04" },
    { name: "Fondamentaux du marketing", teachingUnit: UE3, coefficient: 3, color: "#ea580c" },
    { name: "Expression et communication", teachingUnit: UE3, coefficient: 2, color: "#dc2626" },
    { name: "Anglais", teachingUnit: UE3, coefficient: 2, color: "#db2777" },
    { name: "Projet personnel et professionnel", teachingUnit: UE3, coefficient: 1, color: "#9333ea" },
  ],
};

export const TEMPLATES: Readonly<Record<string, CurriculumTemplate>> = {
  [BUT_GEA_S1.key]: BUT_GEA_S1,
};
