# Module `profile` — Partagé

Authentification (e-mail + mot de passe via Supabase Auth) et profil (`profiles`).
Existant : actions `signIn` / `signUp` (`server/auth-actions.ts`), schéma Zod des identifiants.
À faire : édition du pseudo, nom affiché, avatar.

Ajouté par la PR `charles/focus-social-v2` : `updateProfile(input)` (contrat `API_CONTRACTS.md` §3, pseudo et nom
affiché), `getMyProfile()`, `ProfileForm`. Fuseau (`Europe/Paris`) et objectif du jour (30 min) sont fixes en
attendant `profiles.timezone` (S-04). L'écran d'onboarding du pseudo reste à faire (S-04) : en attendant, la page
Social renvoie vers Profil quand le pseudo manque.
