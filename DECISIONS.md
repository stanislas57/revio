# Décisions

Journal des décisions. Une entrée par décision : date, décision, raison, statut.
Toute décision qui change la stack, la structure, la sécurité ou implique une dépense doit être
validée par Stan **et** Charles.

## Validées

### 2026-11-25 — Stack

Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui, Supabase (Postgres, Auth, Realtime,
RLS, migrations via Supabase CLI), Vercel, Zod, Vitest, Playwright, Lucide, Recharts.
Pas de FastAPI, Redis, Docker, Stripe. Coût visé 0 €. Monolithe modulaire.

### 2026-11-25 — Répartition

Stan : module académique et tableau de bord Accueil. Charles : Focus, XP, streak, social.

## Prises pendant la mise en place du squelette (à relire par les fondateurs)

1. **Next.js 16.4 sans `cacheComponents`.** Le gabarit l'activait par défaut ; désactivé pour éviter
   les contraintes `<Suspense>` autour de l'authentification. Réversible.
2. **Connexion e-mail + mot de passe** (et non lien magique) : le service d'e-mail gratuit de Supabase
   est très limité en nombre d'envois, un lien magique à chaque connexion bloquerait vite la démo.
3. **Mot de passe : 8 caractères minimum.**
4. **Profils lisibles par tous les utilisateurs connectés** (pseudo, nom affiché, avatar) pour pouvoir
   rechercher et ajouter des amis. Aucune donnée sensible dans `profiles`.
5. **Notes et matières strictement privées**, aucune option de partage pour l'instant.
6. **Séances Focus partagées aux amis par défaut** (`visibility = 'friends'`), pour que le fil
   fonctionne sans réglage. Le partage n'expose pas la matière. ⚠️ À valider : l'alternative
   « privé par défaut » est plus protectrice (utilisateurs mineurs).
7. **XP en journal ajout seul**, jamais écrit par le client ; idempotence par
   `unique (user_id, idempotency_key)`. Le streak se dérive des séances / transactions
   (clé `streak:<date>`), pas de table dédiée pour l'instant.
8. **Pas de table `planning` / examens** dans la migration initiale (hors démo).
9. **Tests RLS sans Docker** via PGlite (Postgres compilé en WebAssembly) plutôt que `supabase start`.
10. **Moyenne pondérée** : notes ramenées sur 20, moyenne par matière pondérée par le coefficient de la
    note, moyenne générale pondérée par le coefficient de la matière, matières sans note ignorées, aucun
    arrondi dans le calcul. Convention Revio, **pas une règle officielle** d'établissement.
11. **Clé Supabase « publishable »** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, format `sb_publishable_…`)
    plutôt que l'ancienne clé `anon`. Les deux fonctionnent ; adapter si le projet ne propose que `anon`.

## Proposées par l'audit du 25/11/2026 (à valider par Stan **et** Charles)

Statut : **proposées**. Elles deviennent « validées » quand les deux fondateurs ont approuvé la PR
qui les contient. D-12 et D-20 impliquent ensuite une mise à jour de `CLAUDE.md`.

### D-12 — Répartition v2 (remplace « 2026-11-25 — Répartition »)

Stan : architecture, base, migrations, RLS, auth, `domain/` et `server/` de **tous** les modules
(y compris Focus, gamification, social), écrans académiques, agenda, simulateur, intégration,
déploiement. Charles : `components/` des modules `focus`, `gamification`, `social`, landing page,
profil social, animations, identité visuelle, responsive de ses écrans. Raison : nouveau cahier des
charges de Stan (67 % / 33 %). La table « Propriété des modules » de `CLAUDE.md` est à mettre à jour.

### D-13 — Forme des contrats

Pas d'API REST : types TypeScript dans `src/modules/<m>/contracts.ts`, fixtures dans `fixtures.ts`,
lectures par requêtes serveur, écritures par Server Actions renvoyant `ActionResult<T>`, écritures
sensibles (durées, XP, publications) dans des fonctions SQL `security definer`. Raison : cohérent avec
l'architecture existante, zéro service en plus, typé de bout en bout. Détail : `API_CONTRACTS.md`.

### D-14 — Barème XP de la démo

1 XP par minute, 5 minutes minimum, 180 minutes comptées au plus par séance, 300 XP de durée par jour,
objectif du jour +50 (30 min par défaut), paliers de streak +100 (7 j), +250 (21 j), +500 (30 j).
Bonus « séance planifiée » (+20) après la démo. Règles centralisées dans `gamification/domain/` et
recopiées dans la fonction SQL (une seule source à terme : table `xp_rules`, P1). Convention Revio.

### D-15 — Validation d'un jour de streak

Un jour compte s'il cumule au moins 10 minutes de séances terminées. Le jour est celui de la fin de
séance dans le fuseau de l'utilisateur (`profiles.timezone`, `Europe/Paris` par défaut). Gels de streak
et jours de repos : P1.

### D-16 — Matière visible dans le fil

Par défaut **non partagée** (cohérent avec la décision 6) ; l'utilisateur peut l'activer. La matière est
copiée dans la publication au moment de la fin de séance, la table `subjects` reste privée.

### D-17 — Horodatages des séances écrits par le serveur uniquement

Le client ne peut plus modifier `started_at`, `ended_at`, `status` de `study_sessions` (droits par colonne
retirés) ; tout passe par `start/pause/resume/heartbeat/cancel/finish_study_session`. Raison : sinon un
utilisateur peut déclarer une séance de 10 h et obtenir l'XP correspondante.

### D-18 — Fil et statistiques publiques

Table `posts` créée par `finish_study_session` (unique par séance, pas de note scolaire) et table
`user_stats` (XP total, streak, record, minutes totales) lisible par soi et ses amis. Raison : les amis ne
peuvent pas lire `xp_transactions` ni `subjects` (RLS propriétaire), il faut des données publiques dédiées.

### D-19 — Amis en révision sans temps réel pour la démo

Heartbeat toutes les 60 s, actualisation toutes les 30 s, hors ligne après 3 min sans heartbeat.
Supabase Realtime plus tard si besoin.

### D-20 — Organisation Git

On garde la convention de `CLAUDE.md` (`stan/<sujet>`, `charles/<sujet>`, `fix/<sujet>`) plutôt que
`feature/stanislas-*`. Pas de branche `develop` : `main` est protégée (PR + CI obligatoires), fusion en
« squash ». Seul Stan écrit des migrations. Un seul ajout de dépendance par PR, annoncé.

### D-21 — Périmètre de la démo du 30/11

Dedans : compte + pseudo, matières, notes, moyenne, simulateur simple, Focus (libre et compte à
rebours), XP, niveaux, streak, amis, fil des séances, réaction. Dehors (marqué `NotImplemented`) :
agenda, planning, trophées, classements, ligues, défis, notifications, paiements, Google, temps réel.

### D-22 — Suppression de compte et export sans clé secrète

La suppression passe par la fonction SQL `delete_my_account()` (`security definer`, supprime la ligne
`auth.users` de l'appelant, tout le reste part en cascade) : aucune clé `service_role` dans l'application.
L'export est une route `GET /profil/export` en lecture seule, filtrée sur le compte connecté. Deux réglages
privés ajoutés (S-15), appliqués par la base : `show_live_status` (RLS des séances en cours) et
`default_visibility` (utilisée par `start_study_session`). La valeur par défaut reste « amis » : la décision
« privé par défaut » (point 6) reste ouverte. À valider par Charles (fichier partagé).

### D-23 — Design system Revio (remplace les anciens jetons de marque)

Décidé par Charles à partir des maquettes « Revio, ADN d'interface » (`design/revio-adn/`). Remplace la couleur
de marque violet magenta (D-« design-tokens ») par la palette violet `#7B2FF7`, magenta, encre `#1A1030`, lilas,
lime réservé aux gains d'XP et dégradé réservé à la présence des amis, aux kudos et au bouton « Réviser ».
Polices : Space Grotesk (titres, chiffres) et Inter (texte), SIL OFL, auto-hébergées par `next/font`.

- **Contrastes** : les valeurs du brief ont été mesurées ; trois paires étaient sous le seuil AA, des jetons
  complémentaires sont ajoutés au lieu de modifier les valeurs d'origine (voir `docs/design-system.md`).
- **Mode sombre** : le brief n'en définit pas ; il est dérivé des surfaces encre.
- **Licences** : uniquement des sources gratuites autorisant l'usage commercial (shadcn/ui, Magic UI, Animate UI,
  Motion Primitives, Motion, Lucide, canvas-confetti, uiverse.io, React Bits sans la version Pro). **Pas
  d'Aceternity UI** (licence qui interdit de redistribuer le code) ni de code AGPLv3. Notices dans
  `THIRD_PARTY_NOTICES.md`.
- **Dépendances** (une par PR, D-20) : `motion` (PR 1), `canvas-confetti` (PR 2).
- **Périmètre** : les écrans branchés gardent leurs routes et leurs données ; les fonctions du design qui
  n'existent pas dans le produit (fiches, quêtes, jokers, binôme, ligue, classe, salles d'étude) sont des pages de
  démonstration marquées `MockBadge`.
- `CLAUDE.md` demande l'accord des deux fondateurs pour une refonte : **à confirmer par Stan** (fichier partagé).

## Ouvertes

- Confirmation d'e-mail activée ou non pour la démo.
- Région du projet Supabase (UE recommandée, RGPD).
- Visibilité par défaut des séances (point 6).
- Offre Vercel Hobby réservée à un usage non commercial : à revoir avant monétisation.
- Dépôt GitHub **public** (constaté le 25/11/2026) alors qu'il était prévu privé : à confirmer.
- Pseudo : obligatoire avant d'utiliser Social (proposé en S-04).
