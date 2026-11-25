# CLAUDE.md — règles pour les Claude Code de Stan et de Charles

Revio est construit à deux fondateurs, chacun avec son Claude Code, sur le même dépôt.
Ces règles s'appliquent à toute session. En cas de doute, demander au fondateur plutôt que deviner.

## Langue

- Interface utilisateur : **français**. Code, noms de fichiers, commits, identifiants SQL : **anglais**.
- Réponses au fondateur : français, concises, honnêtes.

## Propriété des modules

| Module (`src/modules/…`)               | Responsable              | Tables                                             |
| -------------------------------------- | ------------------------ | -------------------------------------------------- |
| `academic` + tableau de bord Accueil   | Stan                     | `subjects`, `grades`                               |
| `focus`, `gamification`, `social`      | Charles                  | `study_sessions`, `xp_transactions`, `friendships` |
| `profile`, `src/components`, `src/lib` | Partagé                  | `profiles`                                         |
| `planning`                             | Non attribué (hors démo) | —                                                  |

Ne modifie pas le module de l'autre fondateur sans le dire dans la PR. Les fichiers partagés
(`src/components/**`, `src/lib/**`, `src/app/layout.tsx`, migrations existantes, CI) : changement minimal et justifié.

## Git

- **Une branche par fonctionnalité** depuis `main` : `stan/<sujet>` ou `charles/<sujet>`.
- Jamais de push direct sur `main`. Tout passe par une **pull request**, relue par l'autre fondateur.
- Commits petits, messages en anglais à l'impératif (`Add grade form`).
- Avant d'ouvrir une PR : `npm run check` doit passer.

## Interdits

- **Pas de refonte** ni de changement de stack, de structure ou de librairie sans accord des deux fondateurs
  (consigner dans `DECISIONS.md`).
- **Aucune dépense** (offre payante, domaine, service tiers, clé API facturée) sans accord explicite des fondateurs.
- **Aucun secret dans le dépôt** : pas de clé dans le code, les tests, les logs ou `.env.example`.
  Seule la clé Supabase _publishable_ peut être exposée (`NEXT_PUBLIC_…`). La clé secrète / service_role
  ne va jamais côté client.
- Ne jamais modifier une migration déjà fusionnée : créer une nouvelle migration (`npm run db:new <nom>`).
- Ne jamais présenter une règle de calcul (moyenne, coefficient, compensation…) comme officielle
  d'un établissement. Afficher qu'il s'agit d'une convention Revio.

## Honnêteté

- Dire précisément ce qui est fini, testé, non testé ou factice. Ne jamais annoncer « ça marche »
  sans avoir lancé les vérifications correspondantes.
- Toute UI non fonctionnelle doit être marquée avec `<NotImplemented />` ou `<MockBadge />`
  (`src/components/states/not-implemented.tsx`). Pas de faux bouton qui semble marcher.
- Signaler les hypothèses prises.

## Sécurité et données

- Toute nouvelle table : `enable row level security` + policies `to authenticated` + ajout de cas dans
  `scripts/test-rls.mjs`. Par défaut : propriétaire uniquement.
- Les notes (`grades`) et matières (`subjects`) ne sont **jamais** visibles par d'autres utilisateurs.
- L'XP n'est jamais écrite par le client : fonction SQL `security definer` ou serveur, avec une
  `idempotency_key` déterministe (`session:<uuid>`, `streak:<aaaa-mm-jj>`).
- Valider toutes les entrées serveur avec Zod. Dans chaque page ou action protégée, appeler
  `requireUser()` (`src/lib/auth.ts`) ; le proxy seul n'est pas une barrière de sécurité.
- Utilisateurs potentiellement mineurs : minimiser les données collectées.

## Conventions de code

- TypeScript strict, pas de `any`. Alias `@/` → `src/`.
- Logique métier pure dans `src/modules/<domaine>/domain/` avec tests Vitest à côté (`*.test.ts`).
- Accès données / Server Actions dans `src/modules/<domaine>/server/`. UI du domaine dans `components/`.
- Pages dans `src/app/(app)/<onglet>/page.tsx` : fines, elles assemblent des composants de modules.
- Composants UI de base : shadcn/ui (`npx shadcn@latest add <composant>`), ne pas les réécrire à la main.
- Server Components par défaut ; `"use client"` seulement si nécessaire.

## Commandes

```bash
npm run dev          # http://localhost:3000
npm run check        # lint + types + format + tests + RLS + build (à lancer avant chaque PR)
npm run test         # Vitest
npm run test:db      # migrations + RLS sur PGlite (sans Docker)
npm run test:e2e     # Playwright (macOS 13 : PLAYWRIGHT_CHANNEL=chrome npm run test:e2e)
npm run test:e2e:connected # Playwright avec comptes : démarre le faux serveur seul (docs/E2E.md)
npm run db:new <nom> # nouvelle migration Supabase
```
