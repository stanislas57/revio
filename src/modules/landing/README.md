# Module `landing` — Responsable : Charles

Page d'accueil publique (`src/app/page.tsx`). Aucun appel serveur, aucun appel à Supabase.

## Ce qui est statique et ce qui est interactif

- **Statique (rendu serveur)** : en-tête, hero de la charte (pastille, titre, sous-titre, boutons « Rejoindre la bêta »
  et « Explorer la démo », bandeau « Planifie ✦ Révise ✦ Gagne de l'XP ✦ Recommence »), offre, FAQ, bandeau final,
  pied de page, aperçus (`preview.tsx`).
- **Îlots interactifs (JavaScript client)** : `pillars.tsx` (onglets verticaux), `reveal.tsx` et `xp-count.tsx`
  (apparition au défilement, compteur). Le hero n'a plus de cartes en orbite ni de vues de démo plein écran
  (retirées : la démo complète est sur `/demo`).

## Données de démo

Toutes dans `demo-data.ts` (inventées, aucune vraie XP calculée par le serveur). Les niveaux, les paliers de série et
les règles d'XP sont **lus dans le moteur** (`gamification/domain`) : la démo ne peut pas s'en écarter ; un test
(`demo-data.test.ts`) le garantit (Challenger à 4 280 XP, 64 % vers Expert, 720 XP manquants, +115 XP = 65 min + 50
d'objectif du jour).

## Style

`landing.css` (importé par la page seulement) : fond crème, fond du hero, titres, apparitions, petites animations des
piliers, mouvement réduit. Les couleurs et la police (Inter) viennent de la charte graphique bêta 01 (`globals.css`,
`docs/design-system.md`). Dans un titre, la partie accentuée est en couleur de marque, pas en italique.

## Règles de contenu

Aucun slogan officiel (le titre du hero est **provisoire**), aucun témoignage, aucun nombre d'utilisateurs, **aucun
tarif** (l'offre Premium est « envisagée », sans prix) ; les fonctions non livrées portent « En construction » ou
« Bientôt » ; les aperçus sont illustratifs (données inventées, `MockBadge`). Pas de pages légales (mentions,
confidentialité) : à ajouter avant l'ouverture au public.

## Accessibilité et mouvement

- Rien ne bouge en continu dans le hero (test e2e) : seules les apparitions au défilement et les petites animations des
  piliers jouent une fois, et aucune avec `prefers-reduced-motion`.
- Les anciennes adresses des vues de démo (`/#serie`, `/#progression-xp`…) n'ouvrent plus rien : la page s'affiche
  normalement.
