# Module `social` — Responsable : Charles

Amis, fil automatique, encouragements. Tables : `friendships`, `session_reactions`
(+ lecture des `study_sessions` partagées via la RLS).

État :

- Fait : recherche par pseudo / nom, demandes envoyées et reçues, accepter / refuser / annuler / retirer,
  liste d'amis (niveau, série, statut), « amis en révision », fil des séances terminées, encouragement.
- Le fil est construit directement à partir des séances terminées (pas de table de publications).
- « Amis en révision » : rafraîchissement automatique toutes les 30 s (`AutoRefresh`), pas de Realtime.
- Pas encore : blocage, signalement, classements, groupes, notifications.
