# Module `academic` — Responsable : Stan

Matières, notes, coefficients, moyenne pondérée, simulation, matières prioritaires.
Tables : `subjects`, `grades` (privées, propriétaire uniquement).

État : domaine pur testé (moyennes, groupes UE/semestre, simulateur, priorités, tableau de bord). Migration `20261125010000_academic_module.sql`. Écrans sur l'onglet Accueil : tableau de bord, matières, notes (ajout/édition/suppression), examens, objectif, simulateur « quelle note me faut-il », import d'un modèle d'exemple. Server Actions validées par Zod (`schemas.ts`), `requireUser()` partout. Testé sur le faux serveur local (`e2e/academic.spec.ts`, `E2E_CONNECTED=1`), pas encore sur un vrai Supabase (S-03).
Règle : la convention de calcul est générique, jamais présentée comme officielle d'un établissement.
