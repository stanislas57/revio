# Module `focus` — Responsable : Charles

Séances de révision chronométrées. Table : `study_sessions`.

État :

- Fait : démarrage (libellé, durée prévue, partage), chrono côté navigateur basé sur les horodatages serveur
  (un rechargement ne perd rien), pause / reprise / abandon / fin, récapitulatif de fin de séance.
- Les écritures passent par des fonctions SQL (`pause_`, `resume_`, `abandon_`, `complete_study_session`) :
  le client ne peut pas fixer `started_at`, `status`, la durée ni les XP.
- Pas encore : lien avec une matière du module `academic` (le libellé est un texte libre partagé),
  séance collective, notifications.
- Non testé en navigateur contre un vrai projet Supabase (voir PR).
