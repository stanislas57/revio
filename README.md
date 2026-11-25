# Revio

Application web EdTech : suivi des notes et simulation de moyenne, séances Focus avec XP et streak,
amis et fil automatique. Projet de Stan et Charles. Objectif : démo en ligne le **lundi 30 novembre 2026**.

> État actuel : **squelette**. Authentification e-mail, navigation, schéma de base de données et tests
> sont en place. Les fonctionnalités métier ne sont pas encore développées et sont marquées « Factice »
> dans l'interface.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui · Supabase (Postgres, Auth,
Realtime, RLS) · Zod · Vitest · Playwright · Lucide · Recharts · hébergement Vercel. Coût visé : 0 €.

## Démarrer

Prérequis : Node 22+ (`.nvmrc`), npm.

```bash
npm install
cp .env.example .env.local   # puis renseigner les 2 variables (voir ci-dessous)
npm run dev                  # http://localhost:3000
```

Sans `.env.local`, l'app démarre mais la connexion affiche « Supabase n'est pas configuré » et les
pages protégées restent inaccessibles.

## Configurer Supabase

### Option A — projet Supabase hébergé (gratuit, recommandé pour la démo)

1. Un fondateur crée un compte sur supabase.com et un projet **Free** (région UE, ex. Paris/Francfort).
2. Lier et appliquer les migrations :
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-du-projet>
   npx supabase db push
   ```
3. Dans _Project Settings > API_ : copier l'URL et la clé **publishable** dans `.env.local`.
4. Dans _Authentication > URL Configuration_ : `Site URL` = URL de l'app, et ajouter
   `http://localhost:3000/auth/callback` (+ l'URL Vercel `/auth/callback`) aux _Redirect URLs_.
5. Limite à connaître : l'envoi d'e-mails par défaut de Supabase est très limité (quelques e-mails
   par heure). Pour la démo, on peut désactiver la confirmation d'e-mail (_Authentication > Providers >
   Email > Confirm email_), à décider entre fondateurs.

### Option B — Supabase en local

Nécessite Docker (non installé sur la machine de Stan au 25/11/2026) : `npm run db:start`, puis
`npx supabase status` donne l'URL et la clé locales.

## Scripts

| Commande               | Rôle                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Serveur de développement                                       |
| `npm run check`        | Tout vérifier avant une PR                                     |
| `npm run lint`         | ESLint                                                         |
| `npm run typecheck`    | TypeScript                                                     |
| `npm run format`       | Prettier (écriture)                                            |
| `npm run test`         | Tests unitaires Vitest                                         |
| `npm run test:db`      | Migrations + tests RLS sur PGlite (Postgres WASM, sans Docker) |
| `npm run test:e2e`     | Playwright (desktop + mobile)                                  |
| `npm run db:new <nom>` | Nouvelle migration                                             |
| `npm run db:types`     | Générer les types TS depuis la base locale                     |

Sur macOS 13, Playwright ne fournit plus Chromium : `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`
(utilise Google Chrome installé).

## Déployer sur Vercel

1. Importer le dépôt GitHub dans Vercel (offre Hobby, gratuite).
2. Ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans _Environment Variables_.
3. Ajouter l'URL Vercel dans les _Redirect URLs_ Supabase.

Note : l'offre Hobby de Vercel est réservée à un usage non commercial. À revoir avant toute monétisation.

## Documentation

- [CLAUDE.md](CLAUDE.md) : règles de travail (humains et Claude Code), répartition Stan / Charles.
- [ARCHITECTURE.md](ARCHITECTURE.md) : organisation du code et de la base.
- [DECISIONS.md](DECISIONS.md) : décisions prises et hypothèses à valider.
