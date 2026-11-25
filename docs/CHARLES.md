# Écrans de Charles : état, fixtures, commandes, branchements

Document de passation. **Tout ce qui est écrit ici a été vérifié dans le dépôt** à la date du commit (`main` au commit `748df8f`). Les sources sont citées : si un fait change, ce fichier doit changer avec lui. Les règles de travail sont dans `CLAUDE.md`, les contrats dans `API_CONTRACTS.md`, le backlog dans `TASKS.md` (certaines lignes y sont plus anciennes que le code : en cas de doute, le code fait foi).

## 1. Périmètre

D'après le tableau de `CLAUDE.md` : `focus`, `gamification` et `social` sont à Charles ; `profile`, `src/components` et `src/lib` sont partagés ; `academic` et le tableau de bord Accueil sont à Stan ; `planning` n'est pas attribué. Le module `landing` est annoncé « Responsable : Charles » dans `src/modules/landing/README.md`.

## 2. Les écrans et leur état

Légende : **réel** = lit et écrit dans Supabase (ou le faux serveur) ; **fixtures** = données d'exemple écrites à la main, `MockBadge` affiché ; **statique** = aucun appel serveur ; **non implémenté** = bandeau `NotImplemented`.

| Route                  | Fichier de la page                           | État               | D'où viennent les données                                                                                                                                                                                                                                                                                                  |
| ---------------------- | -------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                    | `src/app/page.tsx`                           | statique           | composants de `src/modules/landing/components` ; l'aperçu (`preview.tsx`) porte `MockBadge`                                                                                                                                                                                                                                |
| `/demo`                | `src/app/demo/page.tsx`                      | fixtures           | `focus/fixtures.ts`, `gamification/fixtures.ts`, `social/fixtures.ts` ; publique, sans Supabase                                                                                                                                                                                                                            |
| `/connexion`           | `src/app/(auth)/connexion/`                  | réel               | `signIn`, `signUp` dans `profile/server/auth-actions.ts`                                                                                                                                                                                                                                                                   |
| `/accueil`             | `src/app/(app)/accueil/page.tsx`             | réel (**Stan**)    | module `academic` (`getAcademicSnapshot`, actions)                                                                                                                                                                                                                                                                         |
| `/focus`               | `src/app/(app)/focus/page.tsx`               | réel               | `getActiveSession`, `getRecentSessions`, `listMySubjects` ; actions `startSession`, `pauseSession`, `resumeSession`, `heartbeatSession`, `finishSession`, `cancelSession` (`focus/server/actions.ts`, qui appellent les fonctions SQL de Stan : `start_study_session`, `heartbeat_study_session`, `finish_study_session`…) |
| `/focus/seance/[id]`   | `src/app/(app)/focus/seance/[id]/page.tsx`   | réel               | `getSessionResult`                                                                                                                                                                                                                                                                                                         |
| `/social`              | `src/app/(app)/social/page.tsx`              | réel               | `getFeed`, `getLiveFriends`, `listFriends`, `listFriendRequests`, `searchUsers`, `toggleReaction` et les actions d'amitié (`social/server/`)                                                                                                                                                                               |
| `/social/classement`   | `src/app/(app)/social/classement/page.tsx`   | **fixtures**       | `FIXTURE_LEADERBOARD_WEEK` (`social/fixtures-leaderboard.ts`)                                                                                                                                                                                                                                                              |
| `/social/amis/[id]`    | `src/app/(app)/social/amis/[id]/page.tsx`    | **fixtures**       | `FIXTURE_PROFILES`, `FIXTURE_SHARED_POSTS` (`social/fixtures-profiles.ts`) : **seuls les identifiants d'exemple existent**, un vrai ami renvoie une 404                                                                                                                                                                    |
| `/profil`              | `src/app/(app)/profil/page.tsx`              | réel               | `getMyProfile`, `getMyGamification`, `getMySettings`, `getLocale` ; formulaires `ProfileForm` et `SettingsForm`                                                                                                                                                                                                            |
| `/profil/trophees`     | `src/app/(app)/profil/trophees/page.tsx`     | **fixtures**       | `FIXTURE_ACHIEVEMENTS_GALLERY` (`gamification/fixtures-achievements.ts`)                                                                                                                                                                                                                                                   |
| `/profil/statistiques` | `src/app/(app)/profil/statistiques/page.tsx` | **fixtures**       | `FIXTURE_STUDY_STATS_30D` et `FIXTURE_STUDY_STATS_EMPTY` (`focus/fixtures-stats.ts`) ; `?etat=vide` affiche l'état vide                                                                                                                                                                                                    |
| `/agenda`              | `src/app/(app)/agenda/page.tsx`              | **non implémenté** | rien (module `planning`, non attribué)                                                                                                                                                                                                                                                                                     |

Aucune de ces pages n'est publique sauf `/`, `/demo` et `/connexion` : toutes les autres appellent `requireUser()` (directement ou via `src/app/(app)/layout.tsx`).

## 3. Où sont les fixtures

- `src/lib/fixtures.ts` : utilisateurs d'exemple partagés (`FIXTURE_USERS`) et `FIXTURE_NOW`, qui fige les dates d'exemple. Afficher `MockBadge` partout où ils apparaissent.
- `src/modules/focus/fixtures.ts`, `fixtures-stats.ts` ; `src/modules/gamification/fixtures.ts`, `fixtures-achievements.ts` ; `src/modules/social/fixtures.ts`, `fixtures-leaderboard.ts`, `fixtures-profiles.ts` ; `src/modules/profile/fixtures.ts` (aucun fichier ne l'importe aujourd'hui).
- Un test vérifie la cohérence des fixtures de focus : `src/modules/focus/fixtures.test.ts`.
- Marqueurs : `MockBadge` (valeur ou bloc factice) et `NotImplemented` (écran entier), dans `src/components/states/not-implemented.tsx`. Règle de `CLAUDE.md` : aucune interface non fonctionnelle sans l'un des deux.

## 4. Lancer le faux serveur et les tests

Le faux serveur (`scripts/fake-supabase.mjs`) exécute les vraies migrations sur PGlite et applique les vraies RLS. Il gère l'authentification, les appels `rpc`, et les lectures/écritures PostgREST courantes ; **il ne gère pas** les ressources imbriquées, le temps réel, le stockage ni les e-mails (en-tête du script).

À la main, pour développer :

```bash
node scripts/fake-supabase.mjs --port 54321          # base en mémoire ; --data <dossier> pour la garder
# .env.local (jamais commité) :
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-fake-key
npm run dev                                           # http://localhost:3000
```

Les variables `NEXT_PUBLIC_*` sont figées au moment du `build` : après les avoir changées, reconstruire.

Tests (scripts de `package.json`) :

| Commande                     | Ce qu'elle fait                                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`              | lint, types, format, Vitest, RLS, build : à lancer avant chaque PR                                                                                                                                         |
| `npm run test`               | Vitest (tests à côté du code, `*.test.ts`)                                                                                                                                                                 |
| `npm run test:db`            | migrations et RLS sur PGlite (`scripts/test-rls.mjs`)                                                                                                                                                      |
| `npm run test:e2e`           | Playwright **sans comptes** : pages publiques et redirections ; les scénarios connectés sont ignorés (port 3100)                                                                                           |
| `npm run test:e2e:connected` | Playwright **avec comptes** : démarre lui-même le faux serveur (port 54399, option `--test-clock`) et l'application (port 3101), puis joue tous les tests, connectés compris ; un seul navigateur (bureau) |

`playwright.connected.config.ts` positionne `E2E_CONNECTED=1` ; les specs connectées se désactivent sans cette variable. Pour tester une séance longue sans attendre, le test appelle `POST /__test/advance-clock` sur le faux serveur (disponible seulement avec `--test-clock`), qui recule le début des séances en cours ; l'application ne contient aucun code de test. Détails dans `docs/E2E.md`. Pour une démo sur un vrai projet : `docs/DEMO.md` et `scripts/seed-demo.mjs`.

Specs existantes : `e2e/journey-connected.spec.ts` (parcours à deux comptes : inscription, pseudo, amis, séance qui rapporte de l'XP, fil, bravo, profil), `demo-journey.spec.ts`, `academic.spec.ts`, `username.spec.ts`, `onboarding.spec.ts`, `nav-links.spec.ts`, et des specs anonymes par écran (`achievements`, `leaderboard`, `friend-profile`, `stats`, `settings`, `landing`, `smoke`).

## 5. À brancher quand Stan livre

Principe (`TASKS.md`, `CLAUDE.md`) : Charles ne crée ni table ni fonction SQL pour ces écrans ; Stan les fournit, puis l'écran passe des fixtures à la vraie requête. Pour chaque écran, une branche `charles/wire-<sujet>` depuis `main`, et à chaque fois : retirer le `MockBadge` de l'écran, ajouter un cas au parcours de `e2e/journey-connected.spec.ts`, vérifier qu'**aucune note, moyenne ni matière** n'apparaît chez un ami, lancer `npm run check` et `npm run test:e2e:connected`.

| Écran                           | Ce que Stan doit fournir                                                                                  | Contrat (type)                                                     | Fichiers à modifier                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profil d'un ami                 | `getSocialProfile` (ligne `SocialProfile` de `API_CONTRACTS.md` ; « pas encore » dans `social/README.md`) | `SocialProfile` dans `social/contracts.ts`                         | `src/app/(app)/social/amis/[id]/page.tsx` : remplacer `FIXTURE_PROFILES` et `FIXTURE_SHARED_POSTS`, retirer `MockBadge` et la 404 réservée aux identifiants d'exemple ; ensuite lier chaque ami de `social/components/friend-list.tsx` (aujourd'hui sans lien) ; `social/page.tsx` pointe vers un profil d'exemple (`FIXTURE_PROFILE_FRIEND`) via `SectionLinks` : à remplacer |
| Trophées                        | catalogue, attribution automatique dans `finish_study_session`, progression (S-18)                        | `Achievement` dans `gamification/contracts.ts` (brouillon P1)      | `src/app/(app)/profil/trophees/page.tsx` : remplacer `FIXTURE_ACHIEVEMENTS_GALLERY` et `FIXTURE_NOW`, retirer `MockBadge`                                                                                                                                                                                                                                                      |
| Classement                      | classement hebdomadaire entre amis, fuseau de l'utilisateur (S-19)                                        | `LeaderboardEntry` dans `gamification/contracts.ts` (brouillon P1) | `src/app/(app)/social/classement/page.tsx` : remplacer `FIXTURE_LEADERBOARD_WEEK`, retirer `MockBadge` ; la sortie du classement ne change qu'un état local dans `leaderboard-preview.tsx` : `participation.tsx` attend des gestionnaires `onLeave` / `onJoin` fournis par la couche serveur                                                                                   |
| Statistiques                    | `getStudyStats` (S-20)                                                                                    | `StudyStats` dans `focus/contracts.ts` (brouillon P1)              | `src/app/(app)/profil/statistiques/page.tsx` : remplacer `FIXTURE_STUDY_STATS_30D` / `_EMPTY`, retirer `MockBadge`                                                                                                                                                                                                                                                             |
| Export et suppression du compte | export JSON, suppression en cascade (S-14)                                                                | non défini                                                         | à ajouter dans `profile` ; aujourd'hui aucun écran n'existe sur `main`                                                                                                                                                                                                                                                                                                         |
| Agenda                          | S-16 (`calendar_events`)                                                                                  | non défini                                                         | `src/app/(app)/agenda/page.tsx` : remplacer le bandeau `NotImplemented`                                                                                                                                                                                                                                                                                                        |

Chaque écran lit déjà ses données à travers un composant qui prend le contrat en entrée : il suffit de lui passer le résultat de la vraie requête à la place de la fixture.

## 6. Rappels de sécurité propres à ces écrans

- Les notes (`grades`) et matières (`subjects`) ne sont jamais visibles par un autre utilisateur (décision D-16).
- L'XP n'est jamais écrite par le client : elle l'est par `finish_study_session`.
- Les horodatages des séances sont écrits par la base uniquement (décision D-17).
- Toute nouvelle table : RLS, policies `to authenticated`, cas dans `scripts/test-rls.mjs`.
- Aucun secret dans le dépôt ; seule la clé _publishable_ peut être exposée (`NEXT_PUBLIC_…`).
