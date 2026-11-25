# Module `focus` — Responsable : Charles

Séances de révision chronométrées. Table : `study_sessions`.
Contraintes déjà en base : une seule séance `in_progress` par utilisateur, visibilité `private` ou `friends`.

Horodatages écrits uniquement par le serveur (migration `20261125020000_lock_study_session_timing.sql`,
décision D-17) : le client appelle `supabase.rpc('start_study_session' | 'pause_study_session' |
'resume_study_session' | 'heartbeat_study_session' | 'cancel_study_session' | 'finish_study_session' |
'set_study_session_visibility')`. Durée réelle : `study_session_seconds(session)`. Une séance sans
heartbeat depuis 12 h est abandonnée au démarrage suivant.

## Ajouté par la PR `charles/focus-social-v2`

- Migration `20261125030000_focus_xp_social.sql` : `finalize_study_session` (= `finish_study_session` + XP +
  série + `user_stats` + `posts`, idempotente), `set_study_session_label`, `my_daily_minutes`.
- Serveur (contrat `API_CONTRACTS.md` §2) : `getActiveSession`, `getRecentSessions`, `getSessionResult`,
  actions `startSession`, `pauseSession`, `resumeSession`, `heartbeatSession`, `cancelSession`, `finishSession`,
  `setSessionVisibility`.
- UI : formulaire de démarrage (libre ou compte à rebours), chrono calculé depuis les horodatages serveur
  (`elapsedSeconds` + `clockOffsetMs`), pause / reprise / abandon / fin, heartbeat toutes les 60 s, récapitulatif
  de fin de séance, séances récentes.
- Champs optionnels ajoutés aux contrats : `ActiveSession.label`, `StartSessionInput.label` (libellé libre, ≤ 60 car.).

État : testé par `npm run test:db` (règles) et `npm run test` (mappers). **Non testé** dans un navigateur ni sur un
vrai projet Supabase (le faux serveur n'a pas encore `rpc`, S-07). Pas de mode Pomodoro automatique, pas de lien
avec les matières du module `academic` (le libellé est un texte libre).
