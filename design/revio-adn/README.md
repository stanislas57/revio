# Revio — Design (5 écrans mobiles + interface web)

## Contenu
- `Fusion-01-Accueil.dc.html` — Accueil mobile (390 × 844)
- `Fusion-02-Fil.dc.html` — Fil social mobile
- `Fusion-03-Focus.dc.html` — Focus à deux mobile
- `Fusion-04-Progression.dc.html` — Progression mobile
- `Fusion-05-Fiches.dc.html` — Fiches mobile
- `Web-01-Accueil.dc.html` — Accueil web desktop (responsive)
- `_runtime/` — scripts qui permettent d'afficher les pages, ne fait pas partie du design

## Voir les écrans
Dans ce dossier, lance un petit serveur local, par exemple :

    python3 -m http.server

puis ouvre http://localhost:8000/Web-01-Accueil.dc.html (ou un autre fichier).
Ouvrir directement le fichier en double-cliquant peut ne pas fonctionner : certains navigateurs bloquent alors ses scripts.
Les liens du menu et du dock passent d'un écran à l'autre.

## Pour l'intégration dans le code
Place ce dossier dans `design/revio-adn/` à la racine du projet, puis utilise le prompt `PROMPT_CLAUDE_CODE_REVIO.md`.
Le design system complet (`Fusion-00-Systeme`) et les licences restent disponibles dans le canevas.
