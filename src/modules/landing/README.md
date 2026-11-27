# Module `landing` — Responsable : Charles

Page d'accueil publique (`src/app/page.tsx`). Aucun appel serveur, aucun appel à Supabase.

## Ce qui est statique et ce qui est interactif

- **Statique (rendu serveur)** : en-tête, hero de la charte (pastille, titre, sous-titre, boutons « Rejoindre la bêta »
  et « Explorer la démo », bandeau « Planifie ✦ Révise ✦ Gagne de l'XP ✦ Recommence »), FAQ, bandeau final,
  pied de page, aperçus (`preview.tsx`).
- **Îlots interactifs (JavaScript client)** : `pillars.tsx` (grille « bento » des quatre piliers, ancre `#piliers`),
  `reveal.tsx` et `xp-count.tsx` (apparition au défilement, compteur). Le hero n'a plus de cartes en orbite ni de vues de démo plein écran
  (retirées : la démo complète est sur `/demo`).

## Données de démo

Toutes dans `demo-data.ts` (inventées, aucune vraie XP calculée par le serveur). Les niveaux, les paliers de série et
les règles d'XP sont **lus dans le moteur** (`gamification/domain`) : la démo ne peut pas s'en écarter ; un test
(`demo-data.test.ts`) le garantit (Challenger à 4 280 XP, 64 % vers Expert, 720 XP manquants, +115 XP = 65 min + 50
d'objectif du jour).

## Les piliers (`pillars.tsx`)

Une grille de cinq cases : Notes (grande case), Rester motivé · XP, Rester motivé · Série, Amis, S'organiser. Chaque
case porte le nom de son pilier et son statut (« En construction », « Bientôt »), et a ses propres boutons
(`pillar-demos.tsx`) : note simulée en Droit (moyenne calculée par `academic/domain`, convention Revio), séance de
25 min qui rapporte +25 XP (niveaux de `gamification/domain`, le citron seulement pour l'XP), jour de série à valider,
bravo à un ami (un par ami, aucun compteur), séances de la semaine à cocher. Quand la grille arrive à l'écran, une
seule fois : l'XP monte, la série s'allume jour après jour, les amis passent « en révision »
(`use-in-view-once.ts`). Avec `prefers-reduced-motion`, l'état final s'affiche directement. Textes et statuts des
piliers : `pillars-content.tsx`.

## Style

`landing.css` (importé par la page seulement) : fond crème, fond du hero, titres, apparitions, petit rebond du gain
d'XP des piliers (`pillar-pop`), mouvement réduit. Les couleurs et la police (Inter) viennent de la charte graphique bêta 01 (`globals.css`,
`docs/design-system.md`). Dans un titre, la partie accentuée est en couleur de marque, pas en italique.

## Règles de contenu

Aucun slogan officiel (le titre du hero est **provisoire**), aucun témoignage, aucun nombre d'utilisateurs, **aucun
tarif** (aucune offre payante, D-25) ; les fonctions non livrées portent « En construction » ou
« Bientôt » ; les aperçus sont illustratifs (données inventées, `MockBadge`). Pas de pages légales (mentions,
confidentialité) : à ajouter avant l'ouverture au public.

## Accessibilité et mouvement

- Rien ne bouge en boucle, ni dans le hero ni dans les piliers (tests e2e) : les apparitions au défilement et les
  réactions de la grille jouent une fois, et aucune avec `prefers-reduced-motion`.
- Piliers : vrais boutons de 44 px au moins, état des séances en `aria-pressed`, résultats annoncés (`aria-live`),
  graphiques décoratifs doublés d'un texte.
- Les anciennes adresses des vues de démo (`/#serie`, `/#progression-xp`…) n'ouvrent plus rien : la page s'affiche
  normalement.
