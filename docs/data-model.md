# Data Model

This document owns persisted application shapes and compatibility behavior.
Firebase path ownership and access rules live in [Firebase](./firebase.md).

## Persisted Tournament Record Shapes

Firebase contains two supported shapes. Both remain readable and writable; the
application does not migrate either shape when it loads a record.

### Current envelope format

Root fields are tournament metadata. Competition data is stored under `main`,
with optional Tournament B data under `tournamentB`.

```javascript
{
  id,
  name,
  date,
  createdAt,
  tournamentMessage,
  portalIdTournament,
  collaborators,
  activeGroup: "A" | "B",
  main: CompetitionData,
  tournamentB: CompetitionData | null
}
```

### Legacy root format

Competition A and metadata share the root. Optional Tournament B data is stored
under `groupB` and older records may contain only a subset of its fields.

```javascript
{
  id,
  name,
  date,
  tournamentMessage,
  portalIdTournament,
  collaborators,
  activeGroup: "A" | "B",
  // CompetitionData fields also live here
  system,
  teams,
  games,
  preferences,
  groupB: Partial<CompetitionData> | null
}
```

## Canonical Application Adapter

`src/services/tournament-record.js` is the only application layer that detects
the persisted format. It exposes format detection, Group A/B selection, root
metadata, Firebase write targets, immutable live updates, and normalization.

Canonical group behavior:

| Situation                     | Selected competition | Firebase prefix |
| ----------------------------- | -------------------- | --------------- |
| Envelope Group A              | `main`               | `main/`         |
| Envelope Group B              | `tournamentB`        | `tournamentB/`  |
| Legacy Group A                | root record          | empty           |
| Legacy Group B                | `groupB`             | `groupB/`       |
| Missing/invalid `activeGroup` | Group A              | Group A prefix  |
| Group B requested but absent  | Group A fallback     | Group A prefix  |

Callers that need to discover or subscribe to a missing B node pass
`allowFallback: false` to `getTournamentStorageTarget`; this returns the correct
B prefix with `data: null` rather than redirecting the subscription to A.

`normalizeTournamentRecord(record, { id, ownerUid })` is pure and returns a new
record with independent arrays/objects. It supplies missing `teams`, `games`,
and preference defaults for owned, shared, archived, and restored records.
Partial legacy `groupB` records receive their own empty competition state while
inheriting configuration such as `system` and preferences; they never inherit
Group A teams, games, or results. Root metadata stays at the root and is read
through `getTournamentMetadata`.

This adapter is application-side compatibility code. It does **not** rename,
move, or rewrite any Firebase tournament path.

## Public Tournament Projection V1

Anonymous Public and TV pages have a derived read model at
`publicTournaments/{ownerUid}/{tournamentId}`. The authoritative legacy and
envelope records above remain unchanged. `src/services/public-tournament-projection.js`
is the single owner of projection derivation, validation, path mapping, and
dual-write compatibility.

```javascript
{
  schemaVersion: 1,
  complete: true,
  revision: number,       // monotonically incremented by Realtime Database
  updatedAt: number,      // Realtime Database server timestamp
  record: {
    name?: string,
    date?: string,
    tournamentMessage?: string,
    activeGroup: "A" | "B",
    main: PublicCompetition,
    tournamentB?: PublicCompetition
  }
}
```

Both authoritative formats project into this envelope. Legacy Group A fields
become `record.main`, legacy `groupB` becomes `record.tournamentB`, and an
envelope keeps `main` and `tournamentB`. Realtime Database omits empty arrays,
empty objects, and null children; the reader restores empty `teams`, `games`,
preferences, and the absent Tournament B through the canonical adapter.

`PublicCompetition` is an exact allowlist of presentation state: system,
teams, games, groups and group schedule, public preferences, round/timer state,
playoff/cadrage/barrage and team-playoff state, TIR presentation state, rating
mode, tournament start/finish state, and public stream links. Public preferences
are limited to scoring, lane start, playoff format/count, group/Swiss round
counts, prize places, time limits, cochonette behavior, and color schema.
Stream presets retain only the `teams` and `lanes` URL maps.

Nested public values are bounded to 12 levels below each competition field.
Derivation truncates deeper containers, the reader rejects over-depth payloads,
and rules enforce the same limit. Stream preset maps are stricter:
`teams|lanes` → preset name → dense URL array, with at most 16 strings.
Projection writes replace a preset array or map as a unit instead of mirroring
individual indices that could create sparse Realtime Database objects.

The persisted projection excludes record IDs supplied by the route,
collaborators, owner and portal administration metadata, emails and tokens,
backups, `gamesCopy`, ranking/schedule-generation history, technical/editor
preferences, and portal team-replacement metadata. The derivation strips
private sentinels recursively, and both the reader and Firebase rules reject
them at every permitted nesting level as well as rejecting unknown V1 wrapper,
competition, and preference fields.

A full projection is readable only when `complete === true`, its V1 shape is
valid, and its revision has not regressed below the last accepted revision.
Missing, partial, malformed, unsupported-version, and permission-denied nodes
use the canonical compatibility reader during the staged rollout. A regressed
revision keeps the last valid in-memory record while awaiting a newer atomic
snapshot.

## Competition Data

```javascript
{
  system: "swiss",              // "swiss" | "groups" | "supermele" | "poules" | "tir"

  // Teams
  teams: [Team, ...],

  // Games (rounds)
  games: [                      // games[0] = round 1, games[1] = round 2, etc.
    [Game, Game, ...],          // Round 1 games
    [Game, Game, ...],          // Round 2 games
  ],
  gamesCopy: [...],             // Backup copy for restore

  // Groups system
  groups: [[Team, ...], ...],   // Teams per group
  groupsScheme: [{top: [], bottom: []}, ...],  // Round-robin rotation schedule

  // Cadrage & Playoff
  cadrage: [CadrageGame, ...],  // Cadrage games (null if not used)
  playOff: [PlayOffGame, ...],  // Current playoff stage
  playOffBracket: {             // Full bracket structure
    stages: [Stage, ...],
    thirdPlace: Game
  },
  isCadrage: false,

  // State
  roundIsActive: false,         // Currently entering scores
  tournamentIsFinished: false,
  // Config
  useRating: false,             // Use rating for first-round seeding
  supermelePlayers: 2,          // (supermele) 2 or 3
  preferences: {
    technical: {
      technicalFirst: 13,       // Winner score for walkover
      technicalSecond: 7        // Loser score for walkover
    },
    maxScore: 13,               // Game ends at this score
    playOffTeams: 8,            // Teams advancing to playoff
    fieldsStart: 1,             // First lane number
    withCadrage: false,         // Enable cadrage round
    playB: false                // Create Tournament B for non-playoff teams
  },

  // TIR (precision shooting)
  tirConfig: { junior: false },
  tirStarted: false,
  tirParticipants: [TirParticipant, ...],
  tirPlayoff: TirPlayoff | null,

  // Portal integration
}
```

## Team Object

```javascript
{
  title: "Kovalenko",           // Team name (usually captain surname)
  rating: 0,                    // FPU portal rating (0 if not imported)
  wins: 0,                      // Games won
  opponents: [],                // Names of all past opponents
  buhgolts: 0,                  // Buchholz score (recalculated each draw)
  smallBuhgolts: 0,             // Small Buchholz (recalculated each draw)
  pointsPlus: 0,                // Total points scored
  pointsMinus: 0,               // Total points conceded
  lanes: [],                    // Lane numbers played [3, 1, 4, ...]
  players: []                   // Player objects [{name, surname}] (for protocol)
}
```

## Game Object (Swiss/Groups)

```javascript
{
  team_1: "Kovalenko",          // Team 1 name
  team_1_score: 13,             // Team 1 score (null before played)
  team_2: "Petrenko",           // Team 2 name
  team_2_score: 7,              // Team 2 score (null before played)
  lane: 3,                      // Assigned lane number
  group: 0                      // (Groups only) group index
}
```

## Game Object (Supermele)

```javascript
{
  team_1: "Player A, Player B",           // Combined team name
  team_1_players: ["Player A", "Player B"], // Individual players
  team_1_score: 13,
  team_2: "Player C, Player D",
  team_2_players: ["Player C", "Player D"],
  team_2_score: 7,
  lane: 2
}
```

## Technical Bye Game

```javascript
{
  team_1: "WeakestTeam",
  team_1_score: 13,             // preferences.technical.technicalFirst
  team_2: "Technical",          // Special marker
  team_2_score: 7              // preferences.technical.technicalSecond
  // No lane assigned
}
```

## Cadrage Game Object

```javascript
{
  id: 1,
  stage: "cadrage",
  team_1: "Kovalenko",
  team_1_place: 9,             // Swiss ranking position
  team_1_score: null,
  team_2: "Petrenko",
  team_2_place: 24,
  team_2_score: null
}
```

## Playoff Game Object

```javascript
{
  id: 1,
  stage: 4,                     // Denominator: 4=quarterfinal, 2=semifinal, 1=final
  team_1: "Kovalenko",
  team_1_place: 1,
  team_1_score: null,
  team_2: "Petrenko",
  team_2_place: 8,
  team_2_score: null
}
```

## Playoff Bracket

```javascript
{
  stages: [
    {
      stageLabel: 4,            // Denominator: 4=quarterfinal, 2=semifinal, 1=final
      teamsCount: 8,            // Total teams in this stage
      teams: [Game, ...]        // Games in this stage
    },
    ...
  ],
  thirdPlace: Game              // Optional third-place match
}
```

---

## Firebase Structure

```
{uid}/
  tournaments/
    {tournamentId}: TournamentRecord // Authoritative active or archived record
  saved/
    {tournamentId}: TournamentRecord // Legacy archive migration source
  stats/
    tags: { [tagId]: { name, color } }
    {gameKey}: StatGame
  statPlayerIdentities/
    {portalPlayerId}: PlayerIdentity
  training/
    list/
      {exerciseId}: Exercise
    {exerciseId}/
      {dateISO}: TrainingResult
    sessions/
      {sessionId}: TrainingSession
  arbiterRegistry/
    updatedAt: number
    source: string
    arbiters: [{ name, role?, category, certificate, region }]
  arbiterPresets/
    {presetId}: { name, createdAt, arbiters: [{ name, role, category, certificate, region }] }

users/
  {uid}/tournaments/{tournamentId}: UserTournamentReference
archive/
  {tournamentId}: PublicArchiveIndexEntry
backups/
  {tournamentId}: WriteOnceArchiveBackup
tokens/
  {uid}/{tournamentId}: NotificationTokens
customRoutes/
  {slug}: TournamentReference
```

See [Firebase](./firebase.md) for current path owners and archive behavior.

## TIR Participant Object

```javascript
{
  id: 1716299000000,            // Timestamp ID
  name: "Player Name",
  city: "Club/City",            // Optional club name
  scores: {
    0: { 6: "carreau", 7: "reussi", 8: "manque", 9: "touche" },
    1: { ... },                 // atelier index → { distance → result }
  },
  lane: 1                       // Assigned lane number
}
```

## TIR Playoff Object

```javascript
{
  size: 5,                      // Qualified-player count; may be non-power-of-two
  qualified: ["Name", ...],     // Names of qualified players
  rounds: [{ matches: [TirMatch, ...] }], // Internal bracket is padded with byes
  thirdPlace: TirMatch | null,
  final: TirMatch | null
}
```

## TIR Match Object

```javascript
{
  player1: "Name", player2: "Name",
  scores1: { 0: {6: "carreau", ...}, ... },  // player 1 scores
  scores2: { ... },                           // player 2 scores
  score1: 45, score2: 38,                     // totals
  complete: false,
  winner: null, loser: null,
  tieWinner: null                             // 1 | 2 if tied
}
```

---

## Pinia Store State

```javascript
{
  tournaments: { [id]: TournamentRecord },  // All active tournaments
  currentTournamentIndex: id,         // Currently viewed tournament
  user: FirebaseUser | false,         // Logged-in user
  isAdmin: boolean,                   // Admin access (portal import)
  savedTournaments: { [id]: TournamentRecord },  // Archived
  message: { show, type, title, text }     // Toast notifications
}
```

## Sync Pattern

The store uses the adapter's storage target to preserve granular write prefixes:
`main/` and `tournamentB/` for envelopes, or the empty prefix and `groupB/` for
legacy records. Root metadata such as name, date, message, portal ID, and
collaborators always keeps its existing root path.

## Pinia Reactive Mutation

The adapter (`tournament-record.js`) is pure: every operation returns a new
object and never mutates its input. The Pinia store intentionally assigns the
returned object to reactive state (`this.tournaments[id] = normalizeTournamentRecord(...)`)
which triggers Vue reactivity. This is the designed boundary between the pure
domain layer and the reactive application layer — the adapter guarantees
immutability, and the store owns the single point of reactive assignment.

TIR scoring components emit replacement participant or match values. The parent
owns reactive assignment and delegates persistence through granular store
actions such as `syncTirParticipants`, `syncTirState`, and
`syncTirPlayoffMatch`; leaf components do not persist records directly.
