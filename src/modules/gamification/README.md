# Module `gamification` — XP, niveaux, série

Table : `xp_transactions` (journal en ajout seul). Le client ne peut PAS écrire d'XP : tout est attribué par
`finalize_study_session` (`security definer`), idempotent via `unique (user_id, idempotency_key)`
(`session:<uuid>`, `daily_goal:<jour>`, `streak:<n>:<jour>`).

Barème (D-14, D-15 ; convention Revio) : 1 XP/min, 5 min minimum, 180 min comptées par séance, 300 XP de durée
par jour, objectif du jour (30 min) +50, série +100 / +250 / +500 à 7 / 21 / 30 jours, jour validé dès 10 min.
Jours à l'heure de Paris. La source de vérité est la migration ; `domain/streak.ts` ne fait que de l'affichage.

Ajouté par la PR `charles/focus-social-v2` :

- Domaine : `streak.ts` (série effective, résumé, grille de jours) testé ; `levels.ts` reste celui de Stan.
- Serveur : `getMyGamification()` (niveau, série, grille 28 jours, totaux) depuis `user_stats`.
- UI : `LevelCard`, `LevelLadder`, `StreakCard`, `StatTiles`, `ProgressBar`.

Pas encore : trophées, classements, défis, ligues, bonus « séance planifiée ». Le composant `ProgressBar` est local
(le registre shadcn n'était pas joignable) ; à remplacer par `shadcn add progress` si vous préférez.
