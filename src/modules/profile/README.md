# Module `profile` — Partagé

Authentification (e-mail + mot de passe via Supabase Auth) et profil (`profiles`).
Existant : actions `signIn` / `signUp` (`server/auth-actions.ts`), schéma Zod des identifiants.
À faire : édition du pseudo, nom affiché, avatar.

Ajouté par Charles : édition du pseudo et du nom affiché (`server/profile-actions.ts`,
`components/profile-form.tsx`). Sans pseudo, un utilisateur n'est pas trouvable par ses amis.
