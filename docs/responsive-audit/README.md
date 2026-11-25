# Audit responsive et accessibilité des écrans connectés

Pages : `/focus` (formulaire), `/focus` (séance en cours), `/focus/seance/[id]`, `/social`, `/profil`.
Largeurs : 375, 768, 1 024, 1 440 px. Thèmes : clair et sombre. Faux serveur Supabase local, deux comptes
(noms d'affichage de 60 caractères, le pire cas), Chromium.

## Méthode (tout est mesuré par un outil, rien « à l'œil »)

| Critère                  | Outil                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Défilement horizontal    | `scrollWidth - clientWidth` du document                                                                         |
| Zones cliquables ≥ 44 px | `getBoundingClientRect` de chaque lien, bouton, champ et `summary` (case à cocher : mesure de son étiquette)    |
| Navigation au clavier    | 70 appuis sur Tab : éléments atteints, et indicateur de focus visible (contour ou ombre) sur chacun             |
| Contraste                | axe-core 4.14.1, règle `color-contrast` (WCAG AA : 4,5 pour le texte), mesuré une fois les animations terminées |
| Texte tronqué            | `text-overflow: ellipsis` avec `scrollWidth > clientWidth`, et texte coupé par `overflow: hidden`               |
| Mouvement réduit         | `prefers-reduced-motion: reduce` émulé, puis `document.getAnimations()` : aucune animation ne doit tourner      |

## Résultats

| Mesure (5 pages × 4 largeurs × 2 thèmes)  | Avant                                                        |                     Après |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------: |
| Défilement horizontal                     | 0                                                            |                         0 |
| Zones cliquables < 44 px dans le contenu  | 144 (dont 24 cases à cocher mesurées par erreur sur la case) |                         0 |
| Textes tronqués ou coupés                 | 0 (noms courts) · `truncate` en place                        | 0 (noms de 60 caractères) |
| Violations de contraste (axe-core)        | 1 *                                                          |                         0 |
| Éléments sans indicateur de focus visible | 8 (lignes de séances récentes)                               |                         0 |
| Animations actives en mouvement réduit    | 0                                                            |                         0 |

\* Artefact de mesure : le texte était mesuré à mi-chemin de son animation d'apparition (opacité partielle). Mesuré après
la fin des animations, aucune violation.

## Corrigé (composants de Charles uniquement)

Boutons, liens et champs à 44 px minimum ; noms et matières qui passent à la ligne au lieu d'être coupés ; indicateur
de focus sur les lignes de séances récentes ; étiquette « Partager avec mes amis » à 44 px.

## Hors périmètre, à voir avec Stan (composants partagés, non modifiés)

- **Navigation (`src/components/layout`)** : 270 zones sous 44 px dans la mesure (liens de la barre latérale à 36 px, logo
  à 28 px, bouton de thème à 36 px, déconnexion à 32 px, mêmes éléments dans l'en-tête mobile).
- **`CardTitle` (shadcn)** rend un `div`, pas un titre : les cartes n'ont pas de niveau de titre pour les lecteurs d'écran.
- **`DialogContent`** : bouton de fermeture de 16 px avec le libellé anglais « Close ».

Captures : 15 images dans ce dossier (375 clair, 375 sombre, 1 440 clair pour chaque page).
