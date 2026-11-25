# Module `gamification` — Responsable : Charles

XP, streak, niveaux. Table : `xp_transactions` (journal en ajout seul).
Le client ne peut PAS écrire d'XP (aucune policy d'écriture). Attribution à faire côté serveur
(fonction SQL `security definer` dans une nouvelle migration), avec une clé `idempotency_key`
déterministe : `session:<uuid>`, `streak:<aaaa-mm-jj>`. La contrainte `unique (user_id, idempotency_key)`
rend chaque attribution idempotente.

Moteur (migration `20261125030000_gamification_engine.sql`) : `finish_study_session` attribue l'XP
(durée, objectif du jour, paliers de streak), met à jour `user_stats` (lisible par soi et ses amis) et
crée la publication dans `posts`, en une transaction idempotente. Règles miroir en TypeScript :
`domain/xp.ts`, `domain/streak.ts`, `domain/levels.ts` (à garder synchronisées). Réglages privés :
`user_settings` (fuseau, objectif du jour, publication auto, partage de la matière).

État : moteur SQL et règles pures testés ; Server Actions et UI à faire.
