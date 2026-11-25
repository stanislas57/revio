# Contrats de données Revio

Ce document fixe les structures que les composants de Charles reçoivent et les fonctions serveur
que Stan fournit. Les **types et les fixtures existent** (branche `stan/contracts`, tâche S-01) ; **aucune fonction serveur
n'est encore implémentée** : tout écran branché sur une fixture affiche `<MockBadge />`.

## Règles

1. **Pas d'API REST.** L'architecture existante (monolithe Next.js + Supabase) passe par :
   - des **requêtes serveur** (`src/modules/<m>/server/queries.ts`) appelées par les pages Server Components,
     qui passent le résultat en props aux composants ;
   - des **Server Actions** (`src/modules/<m>/server/actions.ts`) pour les écritures, appelées depuis les
     composants client de Charles ;
   - des **fonctions SQL `security definer`** pour tout ce qui touche aux durées, à l'XP, aux
     publications (le client n'écrit jamais ces données directement).
2. **Emplacement des types** : `src/modules/<m>/contracts.ts` (Stan). Fixtures typées :
   `src/modules/<m>/fixtures.ts` (Stan, Charles peut en proposer). Les composants de Charles importent
   uniquement `contracts.ts` et `fixtures.ts`, jamais `server/` ni `domain/` (exception : helpers
   d'affichage purs listés ci-dessous). Un `contracts.ts` peut importer le `contracts.ts` d'un autre
   module (types uniquement) : c'est la seule dépendance croisée autorisée.
   Utilisateurs d'exemple partagés : `src/lib/fixtures.ts`.
3. **Conventions** : propriétés en camelCase (comme `src/modules/academic/domain/types.ts`), identifiants
   UUID en `string`, dates-heures ISO 8601 UTC (`IsoDateTime`), jours calendaires `YYYY-MM-DD`
   (`IsoDate`, dans le fuseau de l'utilisateur), durées en minutes entières sauf mention « Seconds ».
4. **Stabilité** : un contrat marqué « Figé » ne change plus de façon incompatible sans annonce dans la PR
   et mise à jour de ce fichier. Ajouter un champ optionnel est compatible.
5. **Jamais** de note, moyenne, objectif scolaire ou matière d'un autre utilisateur dans un contrat
   social. Le nom de matière dans le fil n'apparaît que si l'auteur l'a autorisé (décision D-16 de `DECISIONS.md`).

## Types communs (`src/lib/contracts.ts`)

```ts
export type Uuid = string;
export type IsoDateTime = string; // "2026-11-25T17:30:00Z"
export type IsoDate = string; // "2026-11-25"

export type ErrorCode =
  | "unauthenticated" // pas de session : rediriger vers /connexion
  | "forbidden" // pas le droit (RLS ou règle métier)
  | "not_found"
  | "validation" // entrée refusée par Zod ; `fields` précise
  | "conflict" // doublon, séance déjà en cours, pseudo pris...
  | "rate_limited"
  | "internal";

export type ActionError = { code: ErrorCode; message: string; fields?: Record<string, string> };

/** Retour de toutes les Server Actions. `message` est en français, affichable tel quel. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export type PublicUser = {
  id: Uuid;
  username: string | null; // null tant que le pseudo n'est pas choisi
  displayName: string;
  avatarUrl: string | null;
};
```

## Statut d'implémentation

| Contrat                                              | Module       | Types                    | Fixture | Serveur | Utilisé par        | Statut                                 |
| ---------------------------------------------------- | ------------ | ------------------------ | ------- | ------- | ------------------ | -------------------------------------- |
| `LevelProgress`, `levelProgress()`                   | gamification | S-01                     | S-01    | S-06    | C-01, C-03, C-08   | Types + fixture faits, serveur à faire |
| `StreakSummary`                                      | gamification | S-01                     | S-01    | S-05/06 | C-01, C-03, C-08   | Types + fixture faits, serveur à faire |
| `ActiveSession` + actions Focus                      | focus        | S-01                     | S-01    | S-08    | C-02               | Types + fixture faits, serveur à faire |
| `SessionResult`                                      | focus        | S-01                     | S-01    | S-05    | C-03               | Types + fixture faits, serveur à faire |
| `MyProfile`, `updateProfile`                         | profile      | S-01                     | S-01    | S-04    | onboarding, Profil | Types + fixture faits, serveur à faire |
| `SocialProfile`                                      | social       | S-01                     | S-01    | S-09    | C-08               | Types + fixture faits, serveur à faire |
| Amis (`UserSearchResult`, `FriendRequest`, `Friend`) | social       | S-01                     | S-01    | S-09    | C-04               | Types + fixture faits, serveur à faire |
| `FeedPost`, `FeedPage`, réactions                    | social       | S-01                     | S-01    | S-10    | C-05               | Types + fixture faits, serveur à faire |
| `LiveFriend`                                         | social       | S-01                     | S-01    | S-11    | C-06               | Types + fixture faits, serveur à faire |
| `StudyStats`                                         | focus        | P1                       | P1      | S-20    | C-10               | Brouillon                              |
| `Achievement`                                        | gamification | P1                       | P1      | S-18    | C-11               | Brouillon                              |
| `LeaderboardEntry`                                   | gamification | P1                       | P1      | S-19    | C-12               | Brouillon                              |
| Académique (`Dashboard`, `Subject`, `Grade`, `Exam`) | academic     | existe (`stan/academic`) | —       | S-02    | écrans de Stan     | Partiel                                |

## 1. Gamification

### `LevelProgress`

Niveaux (convention Revio, modifiable) : 1 Novice 0 · 2 Apprenti 500 · 3 Confirmé 1 500 ·
4 Challenger 3 000 · 5 Expert 5 000 · 6 Master 10 000 · 7 Élite 20 000 · 8 Légende 50 000.

```ts
export type LevelInfo = { number: number; name: string; minXp: number };

export type LevelProgress = {
  totalXp: number;
  current: LevelInfo;
  next: LevelInfo | null; // null au niveau 8
  xpIntoLevel: number; // totalXp - current.minXp
  xpUntilNextLevel: number | null; // null au niveau 8
  progress: number; // 0..1 ; 1 au niveau 8
};

/** Fonction pure fournie par Stan (gamification/domain/levels.ts), utilisable côté client.
 * Aussi : LEVELS, STREAK_MILESTONES, nextStreakMilestone(days). */
export function levelProgress(totalXp: number): LevelProgress;
```

Exemple (4 280 XP) :

```json
{
  "totalXp": 4280,
  "current": { "number": 4, "name": "Challenger", "minXp": 3000 },
  "next": { "number": 5, "name": "Expert", "minXp": 5000 },
  "xpIntoLevel": 1280,
  "xpUntilNextLevel": 720,
  "progress": 0.64
}
```

### `StreakSummary`

Règle de validation d'un jour (décision D-15) : au moins **10 minutes** de séances terminées ce jour-là
(fuseau de l'utilisateur, jour de fin de séance). Lancer le chronomètre ne suffit pas.

```ts
export type StreakSummary = {
  currentDays: number;
  recordDays: number;
  todayValidated: boolean;
  todayMinutes: number;
  dailyGoalMinutes: number; // 30 par défaut pour la démo
  dailyGoalCompleted: boolean;
  nextMilestone: number | null; // 3, 7, 14, 21, 30, 50, 100, 200, 365
  lastValidatedOn: IsoDate | null;
};
```

### `XpBreakdownItem`

```ts
export type XpReason =
  | "study_duration" // 1 XP par minute comptée
  | "daily_goal" // +50, une fois par jour
  | "streak_milestone" // +100 à 7 j, +250 à 21 j, +500 à 30 j
  | "planned_session"; // +20, après la démo (pas de planning lundi)

export type XpBreakdownItem = { reason: XpReason; xp: number; label: string };
```

Barème de la démo (décision D-14) : 1 XP/minute, minimum 5 minutes pour gagner de l'XP, au plus
180 minutes comptées par séance et 300 XP de durée par jour. Les bonus sont idempotents
(`session:<uuid>`, `daily_goal:<aaaa-mm-jj>`, `streak:<n>:<aaaa-mm-jj>`).

### Brouillons P1

```ts
export type Achievement = {
  id: string; // slug stable : "first_session", "streak_7"...
  name: string;
  description: string;
  category: "regularity" | "volume" | "social" | "level";
  unlockedAt: IsoDateTime | null;
  progress: { current: number; target: number } | null;
};

export type LeaderboardEntry = {
  rank: number;
  user: PublicUser;
  weeklyXp: number; // XP de la semaine en cours, jamais de note
  isMe: boolean;
};
```

## 2. Focus (chronomètre et séances)

### `ActiveSession`

Le temps affiché est **calculé** à partir des horodatages serveur. `serverNow` permet au client de
corriger le décalage de son horloge : `offset = Date.parse(serverNow) - Date.now()` au chargement.

```ts
export type FocusMode = "free" | "countdown" | "pomodoro";
export type SessionVisibility = "private" | "friends";

export type ActiveSession = {
  id: Uuid;
  mode: FocusMode;
  subject: { id: Uuid; name: string; color: string | null } | null; // matières du propriétaire uniquement
  status: "running" | "paused";
  startedAt: IsoDateTime;
  pausedAt: IsoDateTime | null; // non null quand status = "paused"
  pausedSeconds: number; // total des pauses terminées
  plannedMinutes: number | null; // compte à rebours / pomodoro
  visibility: SessionVisibility;
  serverNow: IsoDateTime;
};

/** Pur, fourni par Stan (focus/domain/elapsed.ts), avec clockOffsetMs() et formatDuration(). */
export function elapsedSeconds(session: ActiveSession, nowMs: number): number;
// = (pausedAt ?? now) - startedAt - pausedSeconds, jamais négatif
```

Champs optionnels ajoutés (compatibles) : `ActiveSession.label?: string | null` et `StartSessionInput.label?: string`
(libellé libre ≤ 60 caractères, décision D-22).

### Requêtes et actions

| Nom                    | Type    | Entrée                                                                                                   | Sortie                        | Permissions         | Erreurs                                         |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------- | ----------------------------------------------- |
| `getActiveSession()`   | requête | —                                                                                                        | `ActiveSession \| null`       | soi                 | `unauthenticated`                               |
| `startSession(input)`  | action  | `{ mode: FocusMode; subjectId?: Uuid; plannedMinutes?: number (1–600); visibility?: SessionVisibility }` | `ActionResult<ActiveSession>` | soi ; matière à soi | `conflict` (séance déjà en cours), `validation` |
| `pauseSession(id)`     | action  | `Uuid`                                                                                                   | `ActionResult<ActiveSession>` | propriétaire        | `not_found`, `conflict` (déjà en pause)         |
| `resumeSession(id)`    | action  | `Uuid`                                                                                                   | `ActionResult<ActiveSession>` | propriétaire        | `not_found`, `conflict`                         |
| `heartbeatSession(id)` | action  | `Uuid` (appel toutes les 60 s, onglet visible)                                                           | `ActionResult<null>`          | propriétaire        | `not_found`                                     |
| `cancelSession(id)`    | action  | `Uuid`                                                                                                   | `ActionResult<null>`          | propriétaire        | `not_found` ; aucune XP, aucune publication     |
| `finishSession(id)`    | action  | `Uuid`                                                                                                   | `ActionResult<SessionResult>` | propriétaire        | `not_found` ; rejouer renvoie le même résultat  |

Une séance sans heartbeat depuis plus de 12 h est abandonnée automatiquement au prochain
`startSession`.

### `SessionResult` (fin de séance)

```ts
export type SessionResult = {
  sessionId: Uuid;
  subjectName: string | null;
  durationMinutes: number; // durée réelle, pauses déduites
  countedMinutes: number; // après plafond
  belowMinimum: boolean; // < 5 min : enregistrée, 0 XP
  earnedXp: number;
  xpBreakdown: XpBreakdownItem[];
  level: LevelProgress; // après la séance
  leveledUp: boolean;
  streak: StreakSummary; // après la séance
  dailyGoalCompleted: boolean;
  newAchievements: Achievement[]; // toujours [] avant S-18
  postCreated: boolean;
  alreadyFinalized: boolean; // true si finishSession a déjà été appelée
};
```

Exemple :

```json
{
  "sessionId": "8f6c1c5e-0000-4000-8000-000000000001",
  "subjectName": "Statistiques",
  "durationMinutes": 45,
  "countedMinutes": 45,
  "belowMinimum": false,
  "earnedXp": 95,
  "xpBreakdown": [
    { "reason": "study_duration", "xp": 45, "label": "45 min de révision" },
    { "reason": "daily_goal", "xp": 50, "label": "Objectif du jour atteint" }
  ],
  "level": {
    "totalXp": 4280,
    "current": { "number": 4, "name": "Challenger", "minXp": 3000 },
    "next": { "number": 5, "name": "Expert", "minXp": 5000 },
    "xpIntoLevel": 1280,
    "xpUntilNextLevel": 720,
    "progress": 0.64
  },
  "leveledUp": false,
  "streak": {
    "currentDays": 15,
    "recordDays": 24,
    "todayValidated": true,
    "todayMinutes": 45,
    "dailyGoalMinutes": 30,
    "dailyGoalCompleted": true,
    "nextMilestone": 21,
    "lastValidatedOn": "2026-11-25"
  },
  "dailyGoalCompleted": true,
  "newAchievements": [],
  "postCreated": true,
  "alreadyFinalized": false
}
```

Différence avec l'exemple du cahier des charges : pas de bonus « séance planifiée » lundi (pas de
planning), donc 95 XP au lieu de 115 ; `level` remplace `currentLevel`/`nextLevel`/`levelProgress`
pour réutiliser `LevelProgress`.

### Brouillon P1 : `StudyStats`

```ts
export type StudyStats = {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
  sessionsCount: number;
  averageSessionMinutes: number;
  bySubject: { subjectId: Uuid | null; name: string; color: string | null; minutes: number }[];
  daily: { date: IsoDate; minutes: number; xp: number }[]; // 30 derniers jours, jours vides inclus
};
```

## 3. Profil

```ts
export type MyProfile = PublicUser & {
  email: string; // jamais exposé aux autres
  timezone: string; // "Europe/Paris" par défaut
  dailyGoalMinutes: number;
  needsUsername: boolean; // true → écran « choisis ton pseudo »
};
```

| Nom                    | Type    | Entrée                                                                   | Sortie                    | Erreurs                                |
| ---------------------- | ------- | ------------------------------------------------------------------------ | ------------------------- | -------------------------------------- |
| `getMyProfile()`       | requête | —                                                                        | `MyProfile`               | `unauthenticated`                      |
| `updateProfile(input)` | action  | `{ username?: string (^[a-z0-9_]{3,24}$); displayName?: string (≤ 60) }` | `ActionResult<MyProfile>` | `conflict` (pseudo pris), `validation` |

## 4. Social

### Relations

```ts
export type Relation = "self" | "none" | "outgoing_pending" | "incoming_pending" | "friends";

export type UserSearchResult = PublicUser & { relation: Relation; friendshipId: Uuid | null };

export type FriendRequest = {
  id: Uuid; // friendshipId
  direction: "incoming" | "outgoing";
  user: PublicUser; // l'autre personne
  createdAt: IsoDateTime;
};

export type Friend = {
  friendshipId: Uuid;
  user: PublicUser;
  since: IsoDateTime;
  level: { number: number; name: string };
  streakDays: number;
  studyingNow: boolean;
};

export type SocialProfile = PublicUser & {
  relation: Relation;
  level: { number: number; name: string }; // visibles seulement par soi et ses amis
  totalXp: number;
  streak: { currentDays: number; recordDays: number };
  totalStudyMinutes: number;
  friendsCount: number;
};
```

| Nom                                  | Type    | Entrée                                         | Sortie                                    | Permissions                                        | Erreurs                                                 |
| ------------------------------------ | ------- | ---------------------------------------------- | ----------------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| `searchUsers(query)`                 | action  | `string`, 3 à 24 caractères, préfixe du pseudo | `ActionResult<UserSearchResult[]>` (≤ 10) | connecté avec pseudo                               | `validation`, `rate_limited`                            |
| `sendFriendRequest(userId)`          | action  | `Uuid`                                         | `ActionResult<FriendRequest>`             | connecté avec pseudo                               | `conflict` (relation existante), `forbidden` (soi-même) |
| `respondFriendRequest(id, response)` | action  | `Uuid`, `"accept" \| "decline"`                | `ActionResult<Friend \| null>`            | destinataire                                       | `not_found`                                             |
| `cancelFriendRequest(id)`            | action  | `Uuid`                                         | `ActionResult<null>`                      | demandeur                                          | `not_found`                                             |
| `removeFriend(friendshipId)`         | action  | `Uuid`                                         | `ActionResult<null>`                      | l'un des deux                                      | `not_found`                                             |
| `listFriends()`                      | requête | —                                              | `Friend[]`                                | soi                                                | —                                                       |
| `listFriendRequests()`               | requête | —                                              | `FriendRequest[]`                         | soi                                                | —                                                       |
| `getSocialProfile(userId)`           | requête | `Uuid`                                         | `SocialProfile \| null`                   | soi ou ami ; sinon champs de jeu à 0 et `relation` | —                                                       |

Refuser une demande supprime la ligne (le schéma actuel n'a que `pending` / `accepted`).
Blocage : P1.

### Fil d'actualité

```ts
export type PostType = "study_session_completed"; // d'autres types après la démo

export type FeedPost = {
  id: Uuid;
  type: PostType;
  author: PublicUser;
  isMine: boolean;
  createdAt: IsoDateTime;
  subjectName: string | null; // null si l'auteur ne partage pas la matière
  durationMinutes: number;
  earnedXp: number;
  streakDays: number;
  reactionsCount: number;
  hasReacted: boolean;
};

export type FeedPage = { posts: FeedPost[]; nextCursor: string | null };
```

| Nom                      | Type    | Entrée                                       | Sortie                                                          | Permissions   | Erreurs     |
| ------------------------ | ------- | -------------------------------------------- | --------------------------------------------------------------- | ------------- | ----------- |
| `getFeed(input)`         | requête | `{ cursor?: string; limit?: number (≤ 20) }` | `FeedPage` (soi + amis, du plus récent au plus ancien)          | soi           | —           |
| `toggleReaction(postId)` | action  | `Uuid`                                       | `ActionResult<{ reactionsCount: number; hasReacted: boolean }>` | auteur ou ami | `not_found` |
| `deletePost(postId)`     | action  | `Uuid`                                       | `ActionResult<null>`                                            | auteur        | `not_found` |

Une seule réaction par personne et par publication (type unique « bravo » pour la démo).

### Amis en révision

```ts
export type LiveFriend = {
  user: PublicUser;
  sessionId: Uuid;
  status: "running" | "paused";
  startedAt: IsoDateTime;
  pausedAt: IsoDateTime | null;
  pausedSeconds: number;
  subjectName: string | null; // même règle que le fil
  serverNow: IsoDateTime;
};
```

`listLiveFriends()` : requête, renvoie `LiveFriend[]` des amis dont la séance est partagée et a reçu
un heartbeat il y a moins de 3 minutes. Le composant rafraîchit toutes les 30 s (`router.refresh()`
ou appel de l'action équivalente), pas de connexion temps réel pour la démo.

## 5. Académique (écrans de Stan)

Types existants sur la branche locale `stan/academic` (`src/modules/academic/domain/types.ts`,
`dashboard.ts`) : `Subject`, `Grade`, `Exam`, `AcademicSnapshot`, `Dashboard`, `Priority`,
`RequiredGradeResult`. Ils restent internes au module académique : Charles n'en a pas besoin et ils ne
doivent jamais apparaître dans un contrat social.
