# Module `profile` — Partagé

Authentification (e-mail + mot de passe via Supabase Auth) et profil (`profiles`).
Existant : actions `signIn` / `signUp` (`server/auth-actions.ts`), schéma Zod des identifiants.
À faire : édition du pseudo, nom affiché, avatar.

Ajouté par la PR `charles/focus-social-v2` : `updateProfile(input)` et `getMyProfile()` (contrat `API_CONTRACTS.md` §3 ;
fuseau et objectif du jour lus dans `user_settings`, valeurs par défaut sinon), `ProfileForm`. L'écran d'onboarding du
pseudo (S-04) reste à faire : en attendant, la page Social renvoie vers Profil quand le pseudo manque.
