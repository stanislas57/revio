# Couleur de marque : violet magenta et blanc

Jetons dans `src/app/globals.css`, en clair (`:root`) et en sombre (`.dark`). Ils sont disponibles comme classes
Tailwind : `bg-brand`, `text-brand-foreground`, `text-brand-text`, `bg-brand-soft`, `text-brand-soft-foreground`,
`border-brand`.

| Jeton                   | Usage                                                 | Clair                   | Sombre                |
| ----------------------- | ----------------------------------------------------- | ----------------------- | --------------------- |
| `brand`                 | Aplats : barres de progression, avatars, pastilles    | `oklch(0.5 0.24 325)`   | `oklch(0.6 0.25 325)` |
| `brand-foreground`      | Texte et icônes posés sur `brand` (blanc)             | `oklch(1 0 0)`          | `oklch(1 0 0)`        |
| `brand-text`            | Texte et icônes de marque sur le fond de la page      | `oklch(0.46 0.23 325)`  | `oklch(0.8 0.12 325)` |
| `brand-soft`            | Fond teinté (niveau actuel, avis de montée de niveau) | `oklch(0.965 0.02 325)` | `oklch(0.3 0.1 325)`  |
| `brand-soft-foreground` | Texte sur `brand-soft`                                | `oklch(0.37 0.15 325)`  | `oklch(0.9 0.05 325)` |

`--primary` (boutons shadcn) n'est **pas** modifié : les composants de Stan restent neutres. Pour appliquer la marque aux
boutons, il suffirait de pointer `--primary` et `--primary-foreground` sur `--brand` et `--brand-foreground`.

## Contraste mesuré (WCAG 2.x)

Outil : les valeurs sont lues dans `globals.css`, converties en sRGB par Chromium (canvas), puis le rapport est calculé.
Seuils : 4,5 pour le texte, 3 pour un aplat d'interface (WCAG 1.4.11).

| Couple (premier plan sur fond)                        | Seuil | Clair | Sombre |
| ----------------------------------------------------- | ----: | ----: | -----: |
| `brand-foreground` sur `brand` (texte blanc)          |   4,5 |  6,46 |   4,73 |
| `brand-text` sur la page                              |   4,5 |  8,09 |   9,85 |
| `brand-text` sur une carte                            |   4,5 |  8,09 |   8,92 |
| `brand-text` sur un bloc `muted`                      |   4,5 |  7,42 |   7,53 |
| `brand-text` sur `brand-soft`                         |   4,5 |  7,24 |   6,91 |
| `brand-soft-foreground` sur `brand-soft`              |   4,5 | 10,26 |  10,23 |
| `brand` (aplat) contre la page                        |     3 |  6,46 |   3,68 |
| `brand` (aplat) contre une carte                      |     3 |  6,46 |   3,34 |
| `brand` (aplat) contre la piste de la barre (`muted`) |     3 |  5,93 |   3,20 |

Les 18 couples passent. Le fond de marque sombre est volontairement dans une fenêtre étroite : plus clair, le texte blanc
passe sous 4,5 ; plus foncé, la barre se confond avec sa piste (sous 3).

**Contrôle en usage réel** : axe-core 4.14.1 (règle `color-contrast`) sur `/focus`, `/focus` en séance, `/focus/seance/[id]`,
`/social` et `/profil`, à 375 et 1 440 px, en clair et en sombre (20 combinaisons) : **0 violation**.

## Remplacé dans les composants de Charles

Tous les `violet-*` et le dégradé `fuchsia` (8 fichiers : fin de séance, avatars, carte de niveau, échelle des niveaux,
amis, fil, aperçus de la landing page). Les `pink-*` (bouton « Bravo », pilier social de la landing page) restent :
ce sont des roses, pas des violets.

## Mise à jour : violet magenta (teinte 325)

La teinte passe de l'indigo (277) au violet magenta (325). Les boutons principaux, l'anneau de focus et l'élément actif du menu latéral (`--primary`, `--ring`, `--sidebar-primary`) utilisent désormais `brand` : avant, ils restaient noirs. Contrastes remesurés, tous au-dessus des seuils AA : texte blanc sur la marque 6,81 (clair) et 4,54 (sombre) ; aplat de marque contre la piste de barre 6,25 (clair) et 3,33 (sombre).
