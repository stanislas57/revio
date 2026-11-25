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
