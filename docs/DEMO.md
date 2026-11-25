# Script de démo Revio (lundi 30/11)

Durée visée : 5 à 6 minutes. Deux navigateurs (ou un navigateur + une fenêtre privée) : **Alice** et **Bob**.

## Avant la démo

1. Comptes de démo (une seule fois, sur le projet utilisé pour la démo) :
   ```bash
   DEMO_PASSWORD='<mot de passe choisi>' node scripts/seed-demo.mjs \
     --url <URL Supabase> --key <clé publishable>
   ```
   Crée `demo-alice@example.test` et `demo-bob@example.test`, amis, avec quelques matières et notes.
   Sur un projet hébergé, la confirmation par e-mail doit être désactivée (décision ouverte, voir `DECISIONS.md`).
   Ne jamais committer le mot de passe.
2. Connecter Alice dans le navigateur 1, Bob dans le navigateur 2. Ouvrir `/accueil` chez Alice et `/social` chez Bob.
3. Vérifier que `npm run check` est vert sur `main` et que l'URL publique répond.

## Déroulé

| Étape | Qui   | Action                                             | À montrer                                                                                |
| ----- | ----- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1     | Alice | Accueil : moyenne, objectif, matières prioritaires | Les priorités sont expliquées (pas d'IA). Mention « convention Revio » sous les moyennes |
| 2     | Alice | Ajouter une note, regarder la moyenne bouger       | Validation (note > barème refusée)                                                       |
| 3     | Alice | Simulateur : « quelle note me faut-il ? »          | Résultat présenté comme une hypothèse, rien n'est enregistré                             |
| 4     | Alice | Focus : choisir une durée, **Démarrer**            | Le chrono survit à un rafraîchissement de la page                                        |
| 5     | Bob   | Social : « 1 ami révise en ce moment »             | Visible sans recharger sous 30 s                                                         |
| 6     | Alice | **Terminer** la séance                             | Écran de fin : XP détaillés, ou « séance trop courte » (< 5 min = 0 XP, c'est normal)    |
| 7     | Bob   | Social : l'ami n'est plus « en révision »          |                                                                                          |
| 8     | Bob   | Profil : niveau, streak, temps total               |                                                                                          |
| 9     | Bob   | Vérifier que les notes d'Alice sont invisibles     | Aucune note, aucune matière côté Bob (RLS, pas seulement masquage)                       |

## À dire honnêtement

- Les XP ne se « seed » pas : les durées sont verrouillées côté serveur. Pour montrer des XP, faire une vraie séance de 5 minutes ou plus.
- Trophées, classement, profil ami et statistiques sont des **écrans sur données d'exemple** (badge « Exemple »). Agenda et planning ne sont pas faits.
- Les moyennes suivent la convention Revio, pas la règle officielle d'un établissement.
- Le parcours est testé automatiquement sur un faux serveur local (`e2e/demo-journey.spec.ts`), pas encore sur un vrai Supabase.

## Plan B si le réseau ou Supabase tombe

Ouvrir `/demo` : galerie publique des écrans Focus, Social et Profil sur données d'exemple, sans base de données.

## Rejouer le test du parcours en local

```bash
node scripts/fake-supabase.mjs --port 54399 &
E2E_CONNECTED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-fake-key npm run test:e2e -- demo-journey
```
