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

Aucun `vercel.json` nécessaire : Vercel détecte Next.js et garde les réglages par défaut.

1. Créer un compte Vercel **Hobby** (gratuit) avec « Continue with GitHub », puis importer
   `stanislas57/revio` en limitant l'accès de l'app GitHub Vercel à ce seul dépôt.
2. Chaque push sur `main` met à jour la production ; chaque autre branche et chaque pull request
   reçoit une URL d'aperçu, publiée en commentaire sur la PR par le bot Vercel.
3. Variables d'environnement (_Settings > Environment Variables_), à ajouter **seulement quand le projet
   Supabase existe**, pour Production et Preview :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clé publishable uniquement, jamais la clé secrète)
4. Dans Supabase (_Authentication > URL Configuration_) : `Site URL` = URL de production Vercel, et
   ajouter aux _Redirect URLs_ `https://<prod>.vercel.app/auth/callback` ainsi que le motif des aperçus
   (`https://*-<compte>.vercel.app/**`) pour que la confirmation d'e-mail marche aussi sur les aperçus.

Sans Supabase, un aperçu affiche la page d'accueil, la connexion (message « non configuré ») et
**`/demo`** : les écrans Focus, Social et Profil avec les données d'exemple des contrats (marqués
« Factice », rien n'est enregistré). Les pages connectées restent fermées.

Limites de l'offre Hobby : usage non commercial uniquement, un seul membre (les aperçus d'un dépôt privé
sont protégés par « Vercel Authentication » et seul le propriétaire du compte peut les ouvrir). Passer à
Pro est une dépense à décider entre fondateurs, pas avant une version publique ou payante.

## Documentation

- [CLAUDE.md](CLAUDE.md) : règles de travail (humains et Claude Code), répartition Stan / Charles.
- [ARCHITECTURE.md](ARCHITECTURE.md) : organisation du code et de la base.
- [DECISIONS.md](DECISIONS.md) : décisions prises et hypothèses à valider.
