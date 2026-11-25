# Module `landing` — Responsable : Charles

Page d'accueil publique (`src/app/page.tsx`). Aucun appel serveur, aucun appel à Supabase.

## Ce qui est statique et ce qui est interactif

- **Statique (rendu serveur)** : en-tête, textes du hero, offre, FAQ, bandeau final, pied de page, aperçus (`preview.tsx`).
- **Îlots interactifs (JavaScript client)** : `orbit-stage.tsx` (cartes en orbite, parallaxe, pause, ouverture des vues),
  `pillars.tsx` (onglets verticaux), `reveal.tsx` et `xp-count.tsx` (apparition au défilement, compteur).
  Les vues de démo plein écran (`demo-dialog.tsx`, `demo-views.tsx`) ne sont chargées qu'à la première ouverture
  d'une carte.

## Données de démo

Toutes dans `demo-data.ts` (inventées, aucune vraie XP calculée par le serveur). Les niveaux, les paliers de série et
les règles d'XP sont **lus dans le moteur** (`gamification/domain`) : la démo ne peut pas s'en écarter ; un test
(`demo-data.test.ts`) le garantit (Challenger à 4 280 XP, 64 % vers Expert, 720 XP manquants, série de 15 jours,
+115 XP = 65 min + 50 d'objectif du jour).

## Style

`landing.css` (importé par la page seulement) : orbites, apparitions, mouvement réduit. Les couleurs viennent des jetons
du projet (`--brand`…) ; seule valeur propre : le fond `#FAFAF8` en clair (en sombre, le fond du projet). La police
serif (Instrument Serif) est chargée dans `fonts.ts`, pour la landing uniquement, sans toucher `layout.tsx`.

## Règles de contenu

Aucun slogan officiel (le titre du hero est **provisoire**), aucun témoignage, aucun nombre d'utilisateurs, **aucun
tarif** (l'offre Premium est « envisagée », sans prix) ; les fonctions non livrées portent « En construction » ou
« Bientôt » ; les aperçus sont illustratifs (données inventées, `MockBadge`). Pas de pages légales (mentions,
confidentialité) : à ajouter avant l'ouverture au public.

## Accessibilité et mouvement

- Les orbites ne tournent que sur écran large (≥ 1024 px) **et** si le mouvement est autorisé ; ailleurs, les six cartes
  forment une grille immobile (téléphone, tablette, `prefers-reduced-motion`).
- Elles s'arrêtent au survol, au focus clavier et avec un bouton « Mettre le mouvement en pause » (un contenu animé
  plus de 5 secondes doit pouvoir être arrêté).
- Chaque carte est un bouton dont le nom accessible est son texte visible. La vue de démo est un dialogue (Radix) :
  Échap, bouton « Retour » ou retour du navigateur la ferment (le hash `#serie`, `#progression-xp`… suit l'ouverture) ;
  le focus revient à la carte.
