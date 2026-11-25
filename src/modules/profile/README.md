# Module `profile` — Partagé

Authentification (e-mail + mot de passe via Supabase Auth) et profil (`profiles`).
Existant : actions `signIn` / `signUp` (`server/auth-actions.ts`), schéma Zod des identifiants.
À faire : édition du pseudo, nom affiché, avatar.

Ajouté par la PR `charles/focus-social-v2` : `updateProfile(input)` et `getMyProfile()` (contrat `API_CONTRACTS.md` §3 ;
fuseau et objectif du jour lus dans `user_settings`, valeurs par défaut sinon), `ProfileForm`. L'écran d'onboarding du
pseudo (S-04) reste à faire : en attendant, la page Social renvoie vers Profil quand le pseudo manque.

## Compte et confidentialité (S-14, S-15)

- Export : `GET /profil/export` (JSON, uniquement les données du compte ; tables absentes listées dans `skippedTables`).
- Suppression : Server Action `deleteMyAccount` (mot `SUPPRIMER` demandé, revérifié côté serveur) → fonction SQL `delete_my_account()`.
- Réglages `showLiveStatus` et `shareSessionsByDefault` : colonnes `show_live_status` / `default_visibility` de `user_settings`, appliquées par la RLS des séances et par `start_study_session`.
