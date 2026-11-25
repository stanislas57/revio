# Architecture

Monolithe modulaire : une seule app Next.js, découpée par domaine métier. Supabase fournit la base,
l'authentification et le temps réel. Pas de backend séparé.

```
Navigateur ──▶ Vercel (Next.js : pages serveur, Server Actions, proxy) ──▶ Supabase (Postgres + RLS, Auth, Realtime)
```

## Arborescence

```
src/
  app/                       Routes (App Router)
    page.tsx                 Page d'accueil publique
    (auth)/connexion/        Connexion / inscription e-mail + mot de passe
    auth/callback/           Lien de confirmation d'e-mail (échange du code)
    auth/deconnexion/        Déconnexion (POST uniquement)
    (app)/                   Zone connectée : layout = AppShell + requireUser()
      accueil/ agenda/ focus/ social/ profil/
  components/
    ui/                      Composants shadcn/ui (générés, ne pas réécrire)
    layout/                  AppShell, navigation (sidebar ≥ md, barre basse mobile), thème
    states/                  États vides, chargement, marqueurs « Factice »
  lib/
    env.ts                   Variables publiques validées par Zod
    routes.ts                Routes protégées, redirections sûres
    auth.ts                  requireUser()
    supabase/                Clients serveur, navigateur, et rafraîchissement de session (proxy)
  modules/<domaine>/
    domain/                  Logique pure + tests Vitest
    server/                  Requêtes et Server Actions
    components/              UI du domaine
    README.md                Périmètre, responsable, état
  proxy.ts                   (ex-middleware) rafraîchit la session, redirige les anonymes
supabase/
  config.jsonc               Config Supabase locale
  migrations/                Schéma SQL versionné
scripts/test-rls.mjs         Tests RLS sur PGlite
e2e/                         Tests Playwright
```

Règle de dépendance : `app` → `modules` → `lib`/`components`. Un module n'importe pas l'intérieur
d'un autre module ; s'il en a besoin, exposer une fonction dans `domain/` ou `server/` et le documenter.

## Authentification

- Supabase Auth, e-mail + mot de passe (8 caractères minimum). Session en cookies via `@supabase/ssr`.
- `src/proxy.ts` rafraîchit la session et redirige les anonymes des routes protégées vers `/connexion`.
- Le layout `(app)` appelle `requireUser()` (vérification serveur auprès de Supabase).
- La vraie barrière de sécurité reste la **RLS** en base.
- Sans variables Supabase, les routes protégées redirigent vers `/connexion` (échec fermé).

## Base de données (migration initiale)

| Table             | Contenu                                                        | Lecture                         | Écriture client                                           |
| ----------------- | -------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `profiles`        | pseudo, nom affiché, avatar (créé à l'inscription par trigger) | utilisateurs connectés          | propriétaire (update)                                     |
| `subjects`        | matières, coefficient                                          | propriétaire                    | propriétaire                                              |
| `grades`          | notes, barème, coefficient                                     | propriétaire                    | propriétaire                                              |
| `study_sessions`  | séances Focus, visibilité `private`/`friends`                  | propriétaire, amis si `friends` | propriétaire                                              |
| `xp_transactions` | journal d'XP, `unique(user_id, idempotency_key)`               | propriétaire                    | **aucune** (serveur uniquement)                           |
| `friendships`     | demandes et amitiés                                            | les deux participants           | demandeur crée, destinataire accepte, les deux suppriment |

Garde-fous en base : une note ne peut référencer qu'une matière du même utilisateur (clé étrangère
composite), note ≤ barème, une seule séance en cours par utilisateur, une seule relation d'amitié par
paire, identifiants d'amitié non modifiables (droits par colonne), `are_friends()` ne répond que pour
les paires incluant l'appelant. Suppression d'un compte : cascade sur toutes ses données.

Vérifié par `npm run test:db` (29 cas). Limite : PGlite simule les rôles et `auth.uid()` de Supabase ;
valider aussi sur un vrai projet Supabase (`supabase db push`) avant la démo.

## Front

- Navigation 5 onglets : Accueil, Agenda, Focus, Social, Profil. Sidebar sur ordinateur (≥ 768 px),
  barre basse fixe sur mobile.
- Thème clair / sombre / système (`next-themes`, classe `.dark`, jetons de couleur shadcn dans `globals.css`).
- `loading.tsx` (squelette) et `error.tsx` dans la zone connectée ; composant `EmptyState` pour les listes vides.
- Tout ce qui n'est pas fonctionnel est marqué par `NotImplemented` / `MockBadge`.

## Tests et CI

- Vitest : logique pure (`src/**/*.test.ts`).
- `test:db` : migrations + RLS.
- Playwright : parcours anonymes (desktop + mobile), sans Supabase.
- GitHub Actions (`.github/workflows/ci.yml`) : lint, types, format, tests, RLS, build, puis e2e.
