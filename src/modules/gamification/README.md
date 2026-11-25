# Module `gamification` — Responsable : Charles

XP, streak, niveaux. Table : `xp_transactions` (journal en ajout seul).
Le client ne peut PAS écrire d'XP (aucune policy d'écriture). Attribution à faire côté serveur
(fonction SQL `security definer` dans une nouvelle migration), avec une clé `idempotency_key`
déterministe : `session:<uuid>`, `streak:<aaaa-mm-jj>`. La contrainte `unique (user_id, idempotency_key)`
rend chaque attribution idempotente.

État : rien d'implémenté.
