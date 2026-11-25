# Design system Revio

Source : les maquettes « Revio, ADN d'interface » (`design/revio-adn/`, référence visuelle uniquement) et le prompt
d'intégration. Décision D-23 de `DECISIONS.md`. Les jetons sont dans `src/app/globals.css`, en clair (`:root`) et en
sombre (`.dark`), et disponibles comme classes Tailwind (`bg-revio-violet`, `text-revio-magenta-text`,
`bg-revio-ink`…) et via les variables shadcn (`--primary`, `--background`, `--ring`…).

## Palette

| Jeton                                             | Valeur                          | Usage                                                                                     |
| ------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `--revio-violet`                                  | `#7B2FF7`                       | actions, liens, primaire (5,85:1 sur blanc)                                               |
| `--revio-violet-hover`                            | `#5B1BC4`                       | survol                                                                                    |
| `--revio-magenta`                                 | `#E11D8F`                       | présence « live », kudos, série : **en fond seulement**                                   |
| `--revio-magenta-text`                            | `#C0157A`                       | magenta en texte sur blanc (5,79:1)                                                       |
| `--revio-xp`                                      | `#C6F432`                       | lime : **uniquement** les gains d'XP, toujours sous du texte encre, jamais en texte       |
| `--revio-ink`, `-2`, `-3`                         | `#1A1030`, `#261A40`, `#3A2D55` | texte, surfaces sombres, bordures sur encre                                               |
| `--revio-lilac`, `--revio-border`, `--revio-grid` | `#F6F1FF`, `#E7DDFB`, `#F1EAFD` | zones secondaires, bordures, grille                                                       |
| `--revio-muted`, `--revio-muted-on-ink`           | `#6B6280`, `#CFC6E6`            | texte secondaire                                                                          |
| `--revio-gradient`                                | violet → magenta                | **trois usages seulement** : présence des amis, kudos et célébrations, bouton « Réviser » |

Répartition visée : environ 70 % de blanc, 20 % de violet et d'encre, 8 % de dégradé, 2 % de lime.
Fond des écrans : blanc avec la grille de 24 px (classe `revio-grid`), qui se fond pour ne pas gêner la lecture.

## Jetons ajoutés pour tenir le contraste (écarts avec le brief)

Les valeurs d'origine ne sont pas modifiées ; trois jetons complémentaires les accompagnent.

| Jeton                                              | Valeur    | Pourquoi                                                                                                       |
| -------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `--revio-magenta-solid` / `--revio-gradient-solid` | `#DC1C8C` | du texte blanc sur `#E11D8F` fait 4,40:1 (minimum 4,5) ; ce magenta fait 4,58:1                                |
| `--revio-violet-on-ink`                            | `#B58CFF` | le violet `#7B2FF7` en texte sur encre fait 3,09:1 ; celui-ci fait 7,03:1                                      |
| `--revio-border-strong`                            | `#857AA0` | la bordure d'un champ doit atteindre 3:1 (WCAG 1.4.11) ; `#E7DDFB` fait 1,30:1, réservé aux cartes (décoratif) |

Le lime sur blanc (1,28:1) ne doit jamais porter une information seul : il accompagne toujours le violet ou un texte encre.

## Polices et formes

- **Space Grotesk** 500 à 700 (titres, chiffres) et **Inter** (texte), SIL OFL, auto-hébergées par `next/font` (aucun appel
  externe à l'exécution). Chiffres tabulaires (`tabular-nums`) pour l'XP, les minuteurs et les classements.
- Rayons : champs 8 px (`rounded-sm`), cartes 14 px (`rounded-lg`), panneaux 24 px (`rounded-xl`), pilules (`rounded-pill`).
- Mouvement : micro-interactions 150 ms (`--dur-micro`), transitions 300 ms (`--dur-base`).

## Mode sombre

Le brief n'en définit pas : il est dérivé des surfaces encre (fond `#1A1030`, cartes `#261A40`, bordures `#3A2D55`,
primaire `#B58CFF` avec texte encre).

## Contrastes mesurés (WCAG 2.x, calcul à partir des valeurs de `globals.css`)

Texte : 4,5:1 minimum. Éléments non textuels (remplissages, bordures de champ, focus) : 3:1 minimum.

| Thème  | Usage                                            | Paire                                          | Ratio | Minimum | Résultat |
| ------ | ------------------------------------------------ | ---------------------------------------------- | ----- | ------- | -------- |
| clair  | texte                                            | `foreground` / `background`                    | 18,09 | 4,5     | ✅       |
| clair  | texte sur carte                                  | `card-foreground` / `card`                     | 18,09 | 4,5     | ✅       |
| clair  | texte sur bouton principal                       | `primary-foreground` / `primary`               | 5,85  | 4,5     | ✅       |
| clair  | texte sur remplissage de marque                  | `brand-foreground` / `brand`                   | 5,85  | 4,5     | ✅       |
| clair  | texte de marque sur la page                      | `brand-text` / `background`                    | 5,85  | 4,5     | ✅       |
| clair  | texte de marque sur carte                        | `brand-text` / `card`                          | 5,85  | 4,5     | ✅       |
| clair  | texte de marque sur zone secondaire              | `brand-text` / `muted`                         | 5,27  | 4,5     | ✅       |
| clair  | texte de marque sur teinte douce                 | `brand-text` / `brand-soft`                    | 5,27  | 4,5     | ✅       |
| clair  | texte sur teinte douce                           | `brand-soft-foreground` / `brand-soft`         | 9,50  | 4,5     | ✅       |
| clair  | magenta-texte sur la page                        | `revio-magenta-text` / `background`            | 5,79  | 4,5     | ✅       |
| clair  | magenta-texte sur carte                          | `revio-magenta-text` / `card`                  | 5,79  | 4,5     | ✅       |
| clair  | magenta-texte sur face secondaire                | `revio-magenta-text` / `secondary`             | 5,22  | 4,5     | ✅       |
| clair  | texte secondaire sur la page                     | `muted-foreground` / `background`              | 5,70  | 4,5     | ✅       |
| clair  | texte secondaire sur carte                       | `muted-foreground` / `card`                    | 5,70  | 4,5     | ✅       |
| clair  | texte secondaire sur zone secondaire             | `muted-foreground` / `muted`                   | 5,14  | 4,5     | ✅       |
| clair  | texte secondaire (bouton)                        | `secondary-foreground` / `secondary`           | 16,32 | 4,5     | ✅       |
| clair  | texte sur accent                                 | `accent-foreground` / `accent`                 | 16,32 | 4,5     | ✅       |
| clair  | menu latéral                                     | `sidebar-foreground` / `sidebar`               | 16,32 | 4,5     | ✅       |
| clair  | texte secondaire du menu                         | `muted-foreground` / `sidebar`                 | 5,14  | 4,5     | ✅       |
| clair  | élément actif du menu                            | `sidebar-accent-foreground` / `sidebar-accent` | 14,06 | 4,5     | ✅       |
| clair  | remplissage de marque contre la page (non-texte) | `brand` / `background`                         | 5,85  | 3       | ✅       |
| clair  | remplissage de marque contre une carte           | `brand` / `card`                               | 5,85  | 3       | ✅       |
| clair  | remplissage contre la piste d'une barre          | `brand` / `muted`                              | 5,27  | 3       | ✅       |
| clair  | bordure de champ (non-texte)                     | `input` / `background`                         | 3,97  | 3       | ✅       |
| clair  | anneau de focus (non-texte)                      | `ring` / `background`                          | 5,85  | 3       | ✅       |
| sombre | texte                                            | `foreground` / `background`                    | 16,32 | 4,5     | ✅       |
| sombre | texte sur carte                                  | `card-foreground` / `card`                     | 14,53 | 4,5     | ✅       |
| sombre | texte sur bouton principal                       | `primary-foreground` / `primary`               | 7,03  | 4,5     | ✅       |
| sombre | texte sur remplissage de marque                  | `brand-foreground` / `brand`                   | 5,41  | 4,5     | ✅       |
| sombre | texte de marque sur la page                      | `brand-text` / `background`                    | 7,03  | 4,5     | ✅       |
| sombre | texte de marque sur carte                        | `brand-text` / `card`                          | 6,26  | 4,5     | ✅       |
| sombre | texte de marque sur zone secondaire              | `brand-text` / `muted`                         | 6,26  | 4,5     | ✅       |
| sombre | texte de marque sur teinte douce                 | `brand-text` / `brand-soft`                    | 4,84  | 4,5     | ✅       |
| sombre | texte sur teinte douce                           | `brand-soft-foreground` / `brand-soft`         | 9,57  | 4,5     | ✅       |
| sombre | magenta-texte sur la page                        | `revio-magenta-text` / `background`            | 8,48  | 4,5     | ✅       |
| sombre | magenta-texte sur carte                          | `revio-magenta-text` / `card`                  | 7,54  | 4,5     | ✅       |
| sombre | magenta-texte sur face secondaire                | `revio-magenta-text` / `secondary`             | 5,83  | 4,5     | ✅       |
| sombre | texte secondaire sur la page                     | `muted-foreground` / `background`              | 11,09 | 4,5     | ✅       |
| sombre | texte secondaire sur carte                       | `muted-foreground` / `card`                    | 9,87  | 4,5     | ✅       |
| sombre | texte secondaire sur zone secondaire             | `muted-foreground` / `muted`                   | 9,87  | 4,5     | ✅       |
| sombre | texte secondaire (bouton)                        | `secondary-foreground` / `secondary`           | 11,23 | 4,5     | ✅       |
| sombre | texte sur accent                                 | `accent-foreground` / `accent`                 | 11,23 | 4,5     | ✅       |
| sombre | menu latéral                                     | `sidebar-foreground` / `sidebar`               | 14,53 | 4,5     | ✅       |
| sombre | texte secondaire du menu                         | `muted-foreground` / `sidebar`                 | 9,87  | 4,5     | ✅       |
| sombre | élément actif du menu                            | `sidebar-accent-foreground` / `sidebar-accent` | 11,23 | 4,5     | ✅       |
| sombre | remplissage de marque contre la page (non-texte) | `brand` / `background`                         | 5,41  | 3       | ✅       |
| sombre | remplissage de marque contre une carte           | `brand` / `card`                               | 4,81  | 3       | ✅       |
| sombre | remplissage contre la piste d'une barre          | `brand` / `muted`                              | 4,81  | 3       | ✅       |
| sombre | bordure de champ (non-texte)                     | `input` / `background`                         | 5,23  | 3       | ✅       |
| sombre | anneau de focus (non-texte)                      | `ring` / `background`                          | 7,03  | 3       | ✅       |
| clair  | magenta-texte sur blanc                          | `#C0157A` / `#FFFFFF`                          | 5,79  | 4,5     | ✅       |
| clair  | blanc sur magenta plein                          | `#FFFFFF` / `#dc1c8c`                          | 4,58  | 4,5     | ✅       |
| clair  | blanc sur début du dégradé                       | `#FFFFFF` / `#7B2FF7`                          | 5,85  | 4,5     | ✅       |
| clair  | blanc sur milieu du dégradé                      | `#FFFFFF` / `#B024D6`                          | 5,16  | 4,5     | ✅       |
| clair  | blanc sur fin du dégradé (texte)                 | `#FFFFFF` / `#dc1c8c`                          | 4,58  | 4,5     | ✅       |
| clair  | encre sur lime (+XP)                             | `#1A1030` / `#c6f432`                          | 14,12 | 4,5     | ✅       |
| clair  | blanc sur encre                                  | `#FFFFFF` / `#1A1030`                          | 18,09 | 4,5     | ✅       |
| clair  | gris clair sur encre                             | `#cfc6e6` / `#1A1030`                          | 11,09 | 4,5     | ✅       |
| clair  | gris clair sur surface encre                     | `#cfc6e6` / `#261A40`                          | 9,87  | 4,5     | ✅       |
| clair  | violet clair (texte) sur encre                   | `#b58cff` / `#1A1030`                          | 7,03  | 4,5     | ✅       |
| clair  | violet clair (texte) sur surface encre           | `#b58cff` / `#261A40`                          | 6,26  | 4,5     | ✅       |
| clair  | magenta (flamme, icône) sur encre                | `#e11d8f` / `#1A1030`                          | 4,11  | 3       | ✅       |

## Composants (`src/components/revio/`)

Page de démonstration : **`/design-system`** (publique, non indexée, données d'exemple de `src/lib/mock/revio-demo.ts`).
Règles communes : vrais `<button>` et `<a>`, noms accessibles, cibles de 44 px, jetons du thème (clair et sombre),
icônes Lucide uniquement, `prefers-reduced-motion` respecté (fondu au lieu du mouvement, aucune célébration).

| Composant                       | Rôle                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `RevioRing`                     | anneau : `progress` (violet + gain lime) et `presence` (dégradé + point « en direct »)       |
| `AvatarPresence`, `PresenceRow` | « En révision maintenant »                                                                   |
| `XpBar`, `AnimatedNumber`       | niveau, barre avec gain lime, chiffres qui glissent                                          |
| `RevioStreakCard`               | série sur fond encre, 7 jours (joker en violet, aujourd'hui en pointillés)                   |
| `QuestList`                     | 3 quêtes ; confettis à la 3ᵉ, **une fois par jour** (`claimDaily`)                           |
| `KudosButton`, `ReactionBar`    | encouragement (**un par jour et par ami**, **aucun compteur**) et 4 réactions                |
| `SharedSheetCard`               | fiche partagée présentée comme un post                                                       |
| `LiveActivityFeed`              | 3 entrées au plus, les anciennes pâlissent par la couleur (jamais par l'opacité : contraste) |
| `LeagueTable`                   | ~30 élèves, réordonnancement animé, badge « ▲ N »                                            |
| `BuddyBeam`                     | binôme et « série à deux »                                                                   |
| `FlashcardStack`                | pile : tap pour retourner, glisser, **toujours deux boutons équivalents**                    |
| `FocusTimer`                    | anneau en dégradé sur encre, libellé « Focus » / « Pause »                                   |
| `RevioSubjectCard`, `BadgeCard` | matière (anneau, fiches, échéance) ; badge en trois raretés écrites                          |
| `MobileDock`, `DesktopSidebar`  | navigation (dock sous 768 px, barre latérale au-dessus) ; `aria-current="page"`              |

Les noms `RevioStreakCard` et `RevioSubjectCard` évitent la collision avec les composants `StreakCard` (gamification)
et `SubjectCard` (academic). La logique pure (géométrie des anneaux, classement, règles « une fois par jour ») est dans
`logic.ts`, testée dans `logic.test.ts`. Aucun composant n'appelle le serveur.

## Licences

Uniquement des sources gratuites autorisant l'usage commercial, textes complets dans `THIRD_PARTY_NOTICES.md`.
Pas d'Aceternity UI (licence interdisant de redistribuer le code), pas de code AGPLv3, pas de version Pro.
En tête de chaque composant copié ou adapté : `// Source : <bibliothèque> — <nom du composant> · Licence <X> · adapté pour Revio`.

## Maquettes

`design/revio-adn/*.dc.html` : six écrans statiques (cinq mobiles et l'accueil web). Pour les afficher, il faut le dossier
`_runtime/` du zip d'origine (non versionné) : `python3 -m http.server` dans le dossier, puis ouvrir un fichier.
