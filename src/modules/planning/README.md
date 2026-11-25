# Module `planning` — Responsable : Stan

Planning de révision basique (S-17) : propose des séances de 45 min sur les 7 prochains jours.

- `domain/generate.ts` : algorithme pur et testé (priorités + temps libre → séances). Convention Revio, pas une méthode officielle.
- Stockage : une séance proposée est un `calendar_events` de type `study` avec `plan_status` (`recommended`, `accepted`, `locked`) ; migration `20261125060000_planned_sessions.sql`. Pas de table dédiée.
- `server/actions.ts` : `generatePlanAction` (remplace les propositions `recommended`, jamais les séances acceptées, verrouillées ou saisies à la main), `setPlanStatus`.
- UI : bouton dans l'Agenda (`components/plan-card.tsx`), badges et boutons Accepter / Verrouiller dans `agenda/components/agenda-day.tsx`.

Hypothèses : fenêtre 8 h–21 h, 3 h de révision par jour au plus, 15 min de pause entre deux séances, une séance par matière et par jour, une matière avec examen n'est planifiée qu'avant le jour de l'examen, une matière à score 0 n'est jamais planifiée. Les séances acceptées qui entrent en conflit avec un nouvel événement sont signalées par l'agenda, pas déplacées.
