# Module `gamification` — Responsable : Charles

XP, streak, niveaux. Table : `xp_transactions` (journal en ajout seul).
Le client ne peut PAS écrire d'XP. Attribution dans la fonction SQL `complete_study_session`
(`security definer`), idempotente via `unique (user_id, idempotency_key)` :
`session:<uuid>`, `streak:<aaaa-mm-jj>`.

Règles (convention Revio, provisoire) : 1 XP / minute effective, plafond 240 XP par séance ;
jour validé pour la série à partir de 10 min ; bonus 100 / 250 / 500 XP à 7 / 21 / 30 jours ;
jours calculés à l'heure de Paris. `domain/rules.ts` n'est qu'une copie d'affichage, la source de
vérité est la migration `focus_xp_social`.

État :

- Fait : niveaux (`domain/levels.ts`, seuils modifiables), carte de niveau, échelle des niveaux,
  carte de série avec grille de 28 jours, tuiles de statistiques, barre de progression.
- Pas encore : trophées, ligues, défis, classements, XP « objectif quotidien / chapitre / séance planifiée »
  (ni objectifs ni chapitres en base).
