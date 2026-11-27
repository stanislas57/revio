# Design system Revio : charte graphique bêta 01

Source : **« Charte graphique & interface produit », version bêta 01** (`design/charte-beta-01.pdf`). Elle remplace la
palette « Revio ADN » (violet `#7B2FF7`, magenta, encre, Space Grotesk) : décision D-24 de `DECISIONS.md`.
Direction : violet électrique et citron vert, Inter, cartes arrondies, interfaces épurées.

Les jetons sont dans `src/app/globals.css`, en clair (`:root`) et en sombre (`.dark`). Ils sont utilisables comme classes
Tailwind (`bg-revio-primary`, `bg-revio-lime`, `text-revio-streak-text`…) et à travers les variables shadcn
(`--primary`, `--background`, `--ring`…). Les composants consomment ces jetons : aucune couleur écrite en dur, à part les
couleurs des matières choisies par l'utilisateur et la page de démonstration de la palette.

## Palette (valeurs de la charte, page 2)

| Couleur         | Jeton                                          | Valeur    | Usage                                                          |
| --------------- | ---------------------------------------------- | --------- | -------------------------------------------------------------- |
| Revio Purple    | `--revio-primary` (`--primary`, `--brand`)     | `#6950EE` | logo, boutons principaux, navigation (texte blanc : 5,27:1)    |
| (survol)        | `--revio-primary-hover` (`--brand-text`)       | `#5840D8` | survol, et **texte / liens violets sur fond clair** (6,69:1)   |
| Electric Lime   | `--revio-lime`                                 | `#D6FA72` | XP, récompenses, progression : **en fond**, jamais en texte    |
| Cream White     | `--revio-landing`                              | `#F8F8F3` | fond de la landing page                                        |
| Cloud White     | `--revio-cloud` (`--background`)               | `#F7F7FB` | fond de l'application                                          |
| Midnight Black  | `--revio-text`, `--revio-midnight`             | `#181921` | titres et texte ; texte sur citron, rose, orange et vert       |
| Pure White      | `--revio-surface` (`--card`)                   | `#FFFFFF` | cartes et surfaces                                             |
| Soft Purple     | `--revio-primary-light` (`--secondary`)        | `#EEEBFF` | sélections, élément actif du menu, fonds légers                |
| Muted Grey      | `--revio-text-secondary` (`--input`)           | `#858391` | décoratif seulement (3,72:1) ; bordure des champs de saisie    |
| (texte lisible) | `--revio-text-readable` (`--muted-foreground`) | `#656371` | petit texte secondaire (5,87:1 sur blanc)                      |
| Border Grey     | `--revio-border` (`--border`)                  | `#EAE9F0` | bordures et séparateurs (décoratifs)                           |
| Success Green   | `--revio-success`                              | `#22C55E` | réussite, point « en direct »                                  |
| Streak Orange   | `--revio-streak`                               | `#F59E0B` | séries et régularité                                           |
| Social Pink     | `--revio-social`                               | `#ED5682` | likes, kudos, réactions                                        |
| (erreur)        | `--revio-error`                                | `#EF4444` | signal d'erreur, toujours accompagné d'un texte ou d'une icône |

La note d'accessibilité de la charte est appliquée telle quelle : `#656371` pour le petit texte, `#5840D8` pour les liens
violets sur fond clair, citron jamais en texte sur blanc, `#EF4444` seulement comme signal.

## Jetons ajoutés pour tenir le contraste

Les valeurs de la charte ne sont pas modifiées. Là où une couleur de la charte est une couleur de fond, un jeton de
texte l'accompagne :

| Jeton                     | Clair     | Sombre    | Pourquoi                                                             |
| ------------------------- | --------- | --------- | -------------------------------------------------------------------- |
| `--revio-social-text`     | `#C2185B` | `#F47BA0` | `#ED5682` en texte sur blanc fait 3,36:1                             |
| `--revio-streak-text`     | `#B45309` | `#F59E0B` | `#F59E0B` en texte sur blanc fait 2,15:1                             |
| `--revio-success-text`    | `#15803D` | `#4ADE80` | `#22C55E` en texte sur blanc fait 2,28:1                             |
| `--destructive`           | `#DC2626` | `#FCA5A5` | `#EF4444` en texte sur blanc fait 3,76:1                             |
| `--revio-primary-on-dark` | —         | `#A99BFF` | `#6950EE` en texte sur `#20202C` fait 3,05:1 ; ce violet fait 6,76:1 |

Sur ces fonds colorés (citron, rose, orange, vert), le texte est toujours Midnight Black (`text-revio-midnight`, identique
dans les deux thèmes) : jamais du blanc, qui échoue sur le rose (3,36:1) et l'orange (2,15:1).

## Typographie et formes (charte, page 3)

- **Inter seule**, police variable 100 à 900, SIL OFL, auto-hébergée par `next/font` (aucun appel externe à l'exécution).
  `font-heading` reste le crochet des titres et des chiffres (même famille). Chiffres tabulaires (`tabular-nums`).

| Élément            | Taille                  | Graisse | Dans le code                      |
| ------------------ | ----------------------- | ------- | --------------------------------- |
| Titre landing page | 42 px (mobile) à 88 px  | 900     | `.landing-display`, hero          |
| Titre de page      | 32 px, 36 px dès 768 px | 800     | `PageHeader`                      |
| Titre de section   | 24 px                   | 700     | `h2` des sections                 |
| Titre de carte     | 16 à 18 px              | 600-700 | `CardTitle`, titres de composants |
| Texte              | 14 à 16 px              | 400     | corps                             |
| Bouton             | 14 px                   | 600     | `Button` (shadcn)                 |
| Texte secondaire   | 12 à 13 px              | 400     | `text-xs text-muted-foreground`   |
| Statistiques et XP | 24 px (mobile) à 28 px  | 800     | `StatCard`, carte de niveau       |

- Rayons : champs 8 px (`rounded-sm`), boutons 12 px (`rounded-md`), cartes 16 à 18 px (`rounded-lg`, `rounded-xl`),
  sections 24 px (`rounded-2xl`), pastilles (`rounded-pill`). Bordures 1 px.
- Ombres légères : `shadow-sm` (`0 2px 8px rgb(24 25 33 / .04)`), `shadow-md` (`0 8px 24px rgb(24 25 33 / .07)`).
- Mouvement : 150 ms (`--dur-micro`) à 250 ms (`--dur-base`) ; tout est coupé avec `prefers-reduced-motion`.
- Icônes Lucide (contour). Dégradés limités : un seul, le fond du hero de la landing (crème vers Soft Purple).
- Navigation : barre latérale blanche sur ordinateur, barre inférieure sur mobile (charte, page 3).

## Mode sombre (charte, page 6)

Fond `#14141E`, surfaces `#20202C`, bordures `#303041`, texte `#F4F2FB`, texte secondaire `#A09EB3`, Soft Purple `#332952`.
Les boutons restent Revio Purple avec du texte blanc ; le violet **en texte** devient `#A99BFF` ; le point du logo devient
citron, comme sur la maquette sombre de la charte. La landing suit le fond sombre (`--revio-landing` vaut `#14141E`).

## Style organique (inspiration Duolingo, couleurs Revio)

- **Boutons « 3D »** : tous les boutons (`components/ui/button.tsx`, `ChunkyButton` pour la grande taille `xl`) ont des
  coins arrondis, un texte en gras et un bord bas plus foncé (`box-shadow`, jetons `--edge-*`) qui disparaît quand on
  appuie : le bouton descend de 4 px. Variante `reward` (citron) réservée aux récompenses et à l'XP.
- **Cartes organiques** (`OrganicCard`, classe `.organic-card`) : coins généreux et irréguliers qui changent lentement de
  forme (14 s), halo en dégradé (violet, rose, citron) qui pulse (6 s). Seules la forme et les couleurs bougent ; le
  contenu ne se déplace jamais.
- **Grille de choix** (`ChoiceGrid`) : grandes cases de 56 px au moins, groupe de boutons radio (flèches, Début, Fin),
  case choisie en violet avec une coche.
- **Mouvement** : toute animation continue s'arrête avec `prefers-reduced-motion` **ou** avec le réglage « Réduire les
  animations » (Profil > Apparence, enregistré sur l'appareil, appliqué avant le premier affichage), qui permet à chacun
  d'arrêter un mouvement de plus de 5 secondes (WCAG 2.2.2).
- **Centrage** : tout le texte est centré (en-têtes de page, cartes, formulaires, dialogues, barre latérale, landing).
  Dans un formulaire, chaque ligne de champs et de boutons se centre (`form :where(.flex)` dans `globals.css`).

## Contrastes mesurés (WCAG 2.x, calcul à partir des valeurs de `globals.css`)

Texte : 4,5:1 minimum. Éléments non textuels (bordure de champ, anneau de focus, barres) : 3:1. Audit axe-core (WCAG 2.2 AA)
de 17 pages en clair et en sombre, à 375 px et à 1 440 px : **0 violation**.

| Thème    | Paire                                          | Couleurs              | Ratio | Minimum | Résultat |
| -------- | ---------------------------------------------- | --------------------- | ----- | ------- | -------- |
| clair    | texte sur le fond de l'app                     | `#181921` / `#f7f7fb` | 16,38 | 4,5     | ✅       |
| clair    | texte sur le fond de la landing                | `#181921` / `#f8f8f3` | 16,43 | 4,5     | ✅       |
| clair    | texte sur carte                                | `#181921` / `#ffffff` | 17,5  | 4,5     | ✅       |
| clair    | texte sur bouton principal (violet)            | `#ffffff` / `#6950ee` | 5,27  | 4,5     | ✅       |
| clair    | violet texte / lien sur le fond                | `#5840d8` / `#f7f7fb` | 6,26  | 4,5     | ✅       |
| clair    | violet texte / lien sur carte                  | `#5840d8` / `#ffffff` | 6,69  | 4,5     | ✅       |
| clair    | violet texte sur la landing                    | `#5840d8` / `#f8f8f3` | 6,28  | 4,5     | ✅       |
| clair    | texte sur Soft Purple (actif, badge)           | `#5840d8` / `#eeebff` | 5,72  | 4,5     | ✅       |
| clair    | bouton secondaire                              | `#5840d8` / `#eeebff` | 5,72  | 4,5     | ✅       |
| clair    | texte secondaire sur le fond                   | `#656371` / `#f7f7fb` | 5,49  | 4,5     | ✅       |
| clair    | texte secondaire sur carte                     | `#656371` / `#ffffff` | 5,87  | 4,5     | ✅       |
| clair    | texte secondaire sur zone neutre               | `#656371` / `#efeef4` | 5,09  | 4,5     | ✅       |
| clair    | texte secondaire sur la landing                | `#656371` / `#f8f8f3` | 5,51  | 4,5     | ✅       |
| clair    | texte secondaire sur Soft Purple (bas du hero) | `#656371` / `#eeebff` | 5,02  | 4,5     | ✅       |
| clair    | midnight sur citron vert (+XP)                 | `#181921` / `#d6fa72` | 14,82 | 4,5     | ✅       |
| clair    | midnight sur Social Pink (kudos)               | `#181921` / `#ed5682` | 5,21  | 4,5     | ✅       |
| clair    | midnight sur Streak Orange (série)             | `#181921` / `#f59e0b` | 8,15  | 4,5     | ✅       |
| clair    | midnight sur Success Green                     | `#181921` / `#22c55e` | 7,68  | 4,5     | ✅       |
| clair    | rose en texte sur carte                        | `#c2185b` / `#ffffff` | 5,87  | 4,5     | ✅       |
| clair    | orange en texte sur carte                      | `#b45309` / `#ffffff` | 5,02  | 4,5     | ✅       |
| clair    | vert en texte sur carte                        | `#15803d` / `#ffffff` | 5,02  | 4,5     | ✅       |
| clair    | erreur en texte sur carte                      | `#dc2626` / `#ffffff` | 4,83  | 4,5     | ✅       |
| clair    | erreur en texte sur le fond                    | `#dc2626` / `#f7f7fb` | 4,52  | 4,5     | ✅       |
| clair    | entrée active du menu                          | `#5840d8` / `#eeebff` | 5,72  | 4,5     | ✅       |
| clair    | entrée du menu                                 | `#656371` / `#ffffff` | 5,87  | 4,5     | ✅       |
| clair    | bordure de champ (non-texte)                   | `#858391` / `#ffffff` | 3,72  | 3,0     | ✅       |
| clair    | anneau de focus (non-texte)                    | `#6950ee` / `#f7f7fb` | 4,93  | 3,0     | ✅       |
| clair    | arc de l'anneau sur sa piste (non-texte)       | `#6950ee` / `#eeebff` | 4,51  | 3,0     | ✅       |
| sombre   | texte sur le fond de l'app                     | `#f4f2fb` / `#14141e` | 16,49 | 4,5     | ✅       |
| sombre   | texte sur le fond de la landing                | `#f4f2fb` / `#14141e` | 16,49 | 4,5     | ✅       |
| sombre   | texte sur carte                                | `#f4f2fb` / `#20202c` | 14,52 | 4,5     | ✅       |
| sombre   | texte sur bouton principal (violet)            | `#ffffff` / `#6950ee` | 5,27  | 4,5     | ✅       |
| sombre   | violet texte / lien sur le fond                | `#a99bff` / `#14141e` | 7,68  | 4,5     | ✅       |
| sombre   | violet texte / lien sur carte                  | `#a99bff` / `#20202c` | 6,76  | 4,5     | ✅       |
| sombre   | violet texte sur la landing                    | `#a99bff` / `#14141e` | 7,68  | 4,5     | ✅       |
| sombre   | texte sur Soft Purple (actif, badge)           | `#f4f2fb` / `#332952` | 11,99 | 4,5     | ✅       |
| sombre   | bouton secondaire                              | `#f4f2fb` / `#332952` | 11,99 | 4,5     | ✅       |
| sombre   | texte secondaire sur le fond                   | `#a09eb3` / `#14141e` | 7,0   | 4,5     | ✅       |
| sombre   | texte secondaire sur carte                     | `#a09eb3` / `#20202c` | 6,16  | 4,5     | ✅       |
| sombre   | texte secondaire sur zone neutre               | `#a09eb3` / `#2a2a38` | 5,41  | 4,5     | ✅       |
| sombre   | texte secondaire sur la landing                | `#a09eb3` / `#14141e` | 7,0   | 4,5     | ✅       |
| sombre   | texte secondaire sur Soft Purple (bas du hero) | `#a09eb3` / `#332952` | 5,09  | 4,5     | ✅       |
| sombre   | midnight sur citron vert (+XP)                 | `#181921` / `#d6fa72` | 14,82 | 4,5     | ✅       |
| sombre   | midnight sur Social Pink (kudos)               | `#181921` / `#ed5682` | 5,21  | 4,5     | ✅       |
| sombre   | midnight sur Streak Orange (série)             | `#181921` / `#f59e0b` | 8,15  | 4,5     | ✅       |
| sombre   | midnight sur Success Green                     | `#181921` / `#22c55e` | 7,68  | 4,5     | ✅       |
| sombre   | rose en texte sur carte                        | `#f47ba0` / `#20202c` | 6,28  | 4,5     | ✅       |
| sombre   | orange en texte sur carte                      | `#f59e0b` / `#20202c` | 7,5   | 4,5     | ✅       |
| sombre   | vert en texte sur carte                        | `#4ade80` / `#20202c` | 9,24  | 4,5     | ✅       |
| sombre   | erreur en texte sur carte                      | `#fca5a5` / `#20202c` | 8,48  | 4,5     | ✅       |
| sombre   | erreur en texte sur le fond                    | `#fca5a5` / `#14141e` | 9,63  | 4,5     | ✅       |
| sombre   | entrée active du menu                          | `#f4f2fb` / `#332952` | 11,99 | 4,5     | ✅       |
| sombre   | entrée du menu                                 | `#a09eb3` / `#20202c` | 6,16  | 4,5     | ✅       |
| sombre   | bordure de champ (non-texte)                   | `#76738d` / `#20202c` | 3,53  | 3,0     | ✅       |
| sombre   | anneau de focus (non-texte)                    | `#a99bff` / `#14141e` | 7,68  | 3,0     | ✅       |
| sombre   | arc de l'anneau sur sa piste (non-texte)       | `#a99bff` / `#332952` | 5,58  | 3,0     | ✅       |
| les deux | blanc sur carte violette (niveau, épique)      | `#FFFFFF` / `#6950EE` | 5,27  | 4,5     | ✅       |
| les deux | barre citron sur carte violette (non-texte)    | `#D6FA72` / `#6950EE` | 4,46  | 3,0     | ✅       |
| les deux | blanc sur bouton destructif                    | `#FFFFFF` / `#DC2626` | 4,83  | 4,5     | ✅       |

## Composants (`src/components/revio/`)

Page de démonstration : **`/design-system`** (publique, non indexée, données d'exemple de `src/lib/mock/revio-demo.ts`).
Règles communes : vrais `<button>` et `<a>`, noms accessibles, cibles de 44 px, jetons du thème (clair et sombre),
icônes Lucide uniquement, `prefers-reduced-motion` respecté (fondu au lieu du mouvement, aucune célébration).

| Composant                       | Rôle                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `RevioRing`                     | anneau violet sur piste Soft Purple : `progress` (gain en citron) et `presence` (point vert)     |
| `AvatarPresence`, `PresenceRow` | « En révision maintenant »                                                                       |
| `XpBar`, `AnimatedNumber`       | niveau, barre avec gain lime, chiffres qui glissent                                              |
| `RevioStreakCard`               | série sur carte blanche, flamme orange, 7 jours (joker violet, aujourd'hui en pointillés)        |
| `QuestList`                     | 3 quêtes ; confettis à la 3ᵉ, **une fois par jour** (`claimDaily`)                               |
| `KudosButton`, `ReactionBar`    | encouragement (**un par jour et par ami**, **aucun compteur**) et 4 réactions                    |
| `SharedSheetCard`               | fiche partagée présentée comme un post                                                           |
| `LiveActivityFeed`              | 3 entrées au plus, les anciennes pâlissent par la couleur (jamais par l'opacité : contraste)     |
| `LeagueTable`                   | ~30 élèves, réordonnancement animé, badge « ▲ N »                                                |
| `BuddyBeam`                     | binôme et « série à deux »                                                                       |
| `FlashcardStack`                | pile : tap pour retourner, glisser, **toujours deux boutons équivalents**                        |
| `FocusTimer`                    | carte blanche, anneau violet, bandeau citron « +XP », libellé « Focus » / « Pause »              |
| `RevioSubjectCard`, `BadgeCard` | matière (anneau, fiches, échéance) ; badge en trois raretés écrites                              |
| `MobileDock`, `DesktopSidebar`  | navigation (barre du bas sous 768 px, barre latérale blanche au-dessus) ; `aria-current`         |
| `RevioLogo`, `StatCard`         | logo « revio. » (texte, point violet ou citron en sombre) ; chiffre + libellé du tableau de bord |

Les noms `RevioStreakCard` et `RevioSubjectCard` évitent la collision avec les composants `StreakCard` (gamification)
et `SubjectCard` (academic). La logique pure (géométrie des anneaux, classement, règles « une fois par jour ») est dans
`logic.ts`, testée dans `logic.test.ts`. Aucun composant n'appelle le serveur.

## Dans l'application

- **Coque** (`src/components/layout/app-shell.tsx`, `main-nav.tsx`, `nav-items.ts`) : `DesktopSidebar` blanche dès 768 px,
  avec les entrées de la charte sur des routes qui existent déjà : Accueil, Mon agenda, Focus, Statistiques
  (`/profil/statistiques`), Mes amis (`/social`), Classement (`/social/classement`), Mon profil. L'entrée active est sur
  Soft Purple ; une sous-page appartient à l'entrée la plus précise (`activeNavHref`, testé). En dessous de 768 px :
  en-tête avec le logo et `MobileDock` en barre inférieure (Accueil, Agenda, « Réviser » au milieu, Amis, Profil).
  **Écart assumé** : la charte écrit « Ma ligue » ; la page existante est un classement hebdomadaire entre amis,
  d'où le libellé « Classement ». Les ligues (divisions, podium) n'existent pas dans le produit.
- **Écrans réels restylés, données inchangées** : Profil (carte de niveau violette avec barre citron, carte de série
  blanche à flamme orange, `StatCard`), Statistiques (`StatCard`), Social (« Bravo » en Social Pink, présence en violet
  avec point vert), Focus (séance sur carte blanche, anneau violet, boutons de la charte).
- **Landing** : fond crème, hero de la charte (« Moins de stress. Plus de progrès. »), boutons « Rejoindre la bêta »
  (inscription) et « Explorer la démo » (`/demo`), bandeau « Planifie ✦ Révise ✦ Gagne de l'XP ✦ Recommence ».
  Le titre vient de la charte : ce n'est pas un slogan validé pour une mise en ligne publique.
- **Aperçu** (`/apercu`, derrière la connexion) : les mêmes écrans de démonstration, aux couleurs de la charte.

## Licences

Uniquement des sources gratuites autorisant l'usage commercial, textes complets dans `THIRD_PARTY_NOTICES.md`.
Pas d'Aceternity UI (licence interdisant de redistribuer le code), pas de code AGPLv3, pas de version Pro.
En tête de chaque composant copié ou adapté : `// Source : <bibliothèque> — <nom du composant> · Licence <X> · adapté pour Revio`.

## Maquettes

- `design/charte-beta-01.pdf` : la charte de référence (7 pages). Ses maquettes sont des reproductions statiques avec des
  données fictives ; les règles d'XP, de ligues et de confidentialité qu'elles montrent ne sont pas des règles du produit.
- `design/revio-adn/` : les maquettes de l'ancienne direction, gardées pour l'historique (elles ne font plus référence).

## Violet profond (D-27) : le noir n'est plus une surface

| Jeton                   | Valeur claire            | Valeur sombre | Usage                                                      | Contraste du texte blanc                          |
| ----------------------- | ------------------------ | ------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `--revio-deep`          | `#332A8F`                | `#4A3DBB`     | onglet actif, pastille d'aujourd'hui, créneaux de révision | 11,24:1 (clair), 7,85:1 (sombre)                  |
| `--revio-exam-gradient` | `#6950EE` vers `#C2185B` | idem          | contrôles, examens, décompte                               | 5,27:1 au minimum (le côté violet, le plus clair) |

Le noir `--revio-midnight` reste la couleur du **texte** sur les remplissages citron, rose, orange et vert. Mesures faites
avec la formule de luminance relative de WCAG 2.2.
