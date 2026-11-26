# Tests de bout en bout

## Sans compte (par défaut)

```bash
npm run test:e2e
```

Construit l'application et vérifie les pages publiques et les redirections (bureau + mobile). Aucun serveur de données.

## Avec comptes (faux serveur Supabase)

```bash
npm run test:e2e:connected
```

Rien à lancer à la main : la commande démarre elle-même le faux serveur (`scripts/fake-supabase.mjs`, base en mémoire, port 54399), construit l'application contre lui (port 3101) et joue **tous** les tests, dont ceux qui exigent des comptes :

- `e2e/journey-connected.spec.ts` : deux comptes, inscription, pseudo, demande d'ami, séance Focus partagée qui rapporte de l'XP, fil, bravo, profil ;
- `academic.spec.ts`, `username.spec.ts`, `demo-journey.spec.ts` : modules de Stan.

Durée : environ 30 secondes en local, construction comprise. Chaque lancement repart d'une base vide. Un seul navigateur (bureau).
Sur macOS 13 : `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e:connected`.

## Horloge simulée : comment tester une séance de 12 minutes sans attendre

Le moteur mesure la durée avec l'horloge de la base (D-17 : le client n'écrit jamais d'horodatage), et une séance de moins de 5 minutes ne rapporte pas d'XP (D-14). Le test ne peut donc pas « tricher » depuis l'application, et c'est voulu.

La solution est **entièrement dans le faux serveur** : lancé avec `--test-clock`, il expose `POST /__test/advance-clock {"minutes": n}`, qui recule de n minutes le début des séances en cours. Le test l'appelle entre « Démarrer » et « Terminer », puis la vraie fonction SQL `finish_study_session` calcule 12 minutes et attribue l'XP.

Pourquoi c'est sans risque en production :

- l'application ne contient **aucun** code de test : pas de variable d'environnement, pas d'en-tête spécial, pas de route cachée ;
- le vrai Supabase n'a pas cette route ; le faux serveur ne l'ouvre que sur `--test-clock`, option que seule `playwright.connected.config.ts` passe ;
- la route refuse toute valeur hors de 1 à 600 minutes.

Limite connue : seul `started_at` est déplacé, pas les battements de cœur ; c'est le cas réaliste d'un client qui bat toutes les minutes. Un test des 3 minutes de silence (D-19) demanderait une autre commande.

## Vérification sur un vrai Supabase (`npm run test:live`)

```bash
set -a && . ./.env.local && set +a && npm run test:live
```

`scripts/check-live.mjs` rejoue, avec la seule clé publishable, les contrôles de l'agenda, du planning, des réglages de confidentialité (statut en direct, visibilité par défaut), du classement, des statistiques, des trophées, des notifications, des scénarios du simulateur et de la suppression de compte sur le projet réellement branché. Il crée **deux comptes jetables** (`check-live-*@example.test`, mot de passe aléatoire jamais affiché) et les supprime à la fin avec `delete_my_account()`. La confirmation d'e-mail doit être désactivée. Il sert aussi à valider une migration juste après un `db push`. Le même script tourne sur le faux serveur : `--url http://127.0.0.1:54399 --key local-fake-key`.
