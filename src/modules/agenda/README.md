# Module `agenda` — Responsable : Stan

Événements privés (révision, cours, indisponibilité, autre) + examens du module `academic`, en vues jour / semaine / mois.
Table : `calendar_events` (propriétaire uniquement, migration `20261125050000_calendar_events.sql`).

Hypothèses (à valider) :

- Dates et heures « murales » dans le fuseau de l'utilisateur, sans `timestamptz` : un créneau à 18 h reste à 18 h après un changement d'heure.
- Un événement ne passe pas minuit ; pas de fuseau multiple.
- Répétition simple (aucune, quotidienne, hebdomadaire), toujours bornée (un an au plus). Modifier ou supprimer agit sur **toute la série** (pas d'exception par occurrence).
- Les examens se gèrent depuis l'Accueil ; l'agenda les affiche seulement.
- Un créneau de révision qui chevauche un autre créneau ou une indisponibilité est signalé, jamais bloqué.

Hors périmètre ici : génération automatique du planning (S-17, `planning`).

## Ajout rapide, sans saisie (`quick-add.tsx`, `domain/quick-add.ts`)

L'agenda s'ajoute par un parcours de gros boutons : type (Révision, Cours, Examen, Devoir, Projet, Pause), matière (ses
matières, ou « Autre » avec des libellés prêts), jour (Aujourd'hui, Demain, Après-demain, Ce week-end, Semaine prochaine),
heure et durée (une seule fois, sans passer minuit), récapitulatif, « Ajouter ». Aucune règle nouvelle côté serveur :
`addEvent` (ou `addExam` pour un examen, qui dure toute la journée) valide tout. Correspondance avec la base : Révision →
`study`, Cours → `class`, Pause → `unavailable`, Devoir et Projet → `other` (le type est dans le titre). L'ancien formulaire
reste, replié sous « Saisie détaillée », pour l'heure précise, la répétition et la date libre.

## Emploi du temps : les trois vues (`agenda-header.tsx`, `week-grid.tsx`, `agenda-day.tsx`, `month-grid.tsx`)

Design d'origine : l'archive « Emploi du temps organique » (vue semaine web, « Ma journée » et « Vue du mois » mobiles),
adaptée à la **charte bêta 01** (D-24) : violet `#6950EE`, **Inter seule** (pas de Space Grotesk), jetons de `globals.css`.

- **Semaine** : trois cartes (prochain contrôle avec décompte, révision prévue, cours de la semaine), la légende, puis la
  grille horaire (8 h à 19 h, élargie si un créneau sort de cette plage ; 56 px par heure ; créneaux qui se chevauchent côte
  à côte ; trait « maintenant » dans la colonne du jour). Chaque carte mène au jour, où l'on modifie ou supprime. Sous
  768 px la grille défile sur le côté dans sa propre région (focusable au clavier), la page ne défile pas.
- **Jour** : la bande des sept jours de la semaine (point = quelque chose de prévu, toque = contrôle), puis une frise
  verticale : fait (coche), en cours (anneau rose, barre de progression, « Fin dans … »), à venir. Toutes les actions
  d'avant restent (modifier, supprimer, accepter, verrouiller, chevauchement signalé).
- **Mois** : grille avec pastille sombre pour aujourd'hui, pastille violette pour un jour de contrôle, points par type,
  légende, puis « À venir » (les prochains contrôles, avec décompte).
- Logique pure et testée : `domain/timetable.ts` (placement, durées, « maintenant » dans le fuseau, états de la frise).
  La page est un instantané : « aujourd'hui » et « maintenant » sont lus une fois, à chaque chargement.

**Volontairement absent** (rien dans les données ne le permet, rien n'est inventé) : synchronisation avec un ENT
(« cours synchronisés »), « Sarah te rejoint » et tout ce qui touche aux amis, créneaux suggérés avec XP, jokers de série et
bandeau de série du mois, anneau « 78 % » de l'objectif. Les créneaux viennent de ce que la personne saisit.
