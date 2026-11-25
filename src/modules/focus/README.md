# Module `focus` — Responsable : Charles

Séances de révision chronométrées. Table : `study_sessions`.
Contraintes déjà en base : une seule séance `in_progress` par utilisateur, visibilité `private` ou `friends`.

Horodatages écrits uniquement par le serveur (migration `20261125020000_lock_study_session_timing.sql`,
décision D-17) : le client appelle `supabase.rpc('start_study_session' | 'pause_study_session' |
'resume_study_session' | 'heartbeat_study_session' | 'cancel_study_session' | 'finish_study_session' |
'set_study_session_visibility')`. Durée réelle : `study_session_seconds(session)`. Une séance sans
heartbeat depuis 12 h est abandonnée au démarrage suivant.

Serveur (pour l'UI de Charles) : `server/queries.ts` → `getActiveSession()` ; `server/actions.ts` →
`startSession`, `pauseSession`, `resumeSession`, `cancelSession`, `heartbeatSession`, `finishSession`
(renvoient `ActionResult<…>`, voir `contracts.ts`). Temps affiché : `domain/elapsed.ts`.

État : moteur SQL, XP et actions serveur faits et testés ; UI (Charles) à faire.
