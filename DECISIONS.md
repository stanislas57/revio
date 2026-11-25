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

## Ajoutées par Charles avec la migration `focus_xp_social` (à relire par Stan)

12. **Libellé de séance partageable** (`study_sessions.label`, texte libre ≤ 60 car.). Les amis voient ce
    libellé, jamais la matière du module `academic` (qui reste privée).
13. **Écritures de séance côté serveur uniquement.** Le client ne choisit que libellé, durée prévue et
    visibilité ; `started_at`, `status`, durée et XP viennent de fonctions SQL `security definer`
    et d'un trigger. Seuls `visibility` et `label` restent modifiables directement.
14. **Règles XP / série** (conventions Revio, pas officielles) : 1 XP/min, plafond 240 XP/séance ;
    jour validé ≥ 10 min ; bonus 100/250/500 XP à 7/21/30 jours ; jours à l'heure de Paris.
    Les XP « objectif quotidien », « séance planifiée », « chapitre » du cahier des charges ne sont pas
    implémentés (pas d'objectifs, de planning ni de chapitres en base).
15. **Fil = séances terminées partagées**, pas de table de publications. Réactions : une par utilisateur et par
    séance (`session_reactions`).
16. **Pas de Realtime pour la démo** : rafraîchissement toutes les 30 s de la page Social. Réversible.
17. **Nouvelles fonctions SQL appelables par les utilisateurs connectés** : `pause/resume/abandon/complete_study_session`,
    `my_gamification`, `get_friends_overview` (limitées à l'appelant). `streak_stats` n'est pas appelable par le client.

## Ouvertes

- Confirmation d'e-mail activée ou non pour la démo.
- Région du projet Supabase (UE recommandée, RGPD).
- Visibilité par défaut des séances (point 6) : le formulaire Focus coche « Partager » par défaut, la décision reste à prendre.
- Offre Vercel Hobby réservée à un usage non commercial : à revoir avant monétisation.
