# Data Model

## Tournament Object

```javascript
{
  id: 1716299000000,            // Timestamp-based unique ID
  name: "Tournament A",
  system: "swiss",              // "swiss" | "groups" | "supermele"
  createdAt: "2024-05-21T...",

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
  tournamentMessage: "",        // Message shown to public viewers

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

  // Portal integration
  portalIdTournament: null      // UFP portal tournament ID (admin only)
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
  stage: 8,                     // Stage value (8=quarterfinal, 4=semi, 2=final, 1=final)
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
      stageLabel: 4,            // 4=quarterfinal, 2=semifinal, 1=final
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
    {tournamentId}: Tournament    // Max 10 active tournaments
  saved/
    {tournamentId}: Tournament    // Archived (no limit)
  stats/
    tags: { [tagId]: { name, color } }
    {gameKey}: StatGame
  training/
    list/
      {exerciseId}: Exercise
    {exerciseId}/
      {dateISO}: TrainingResult

tokens/
  {uid}/{tournamentId}: {         // For public link sharing
    share_token: string
  }
```

## Pinia Store State

```javascript
{
  tournaments: { [id]: Tournament },  // All active tournaments
  currentTournamentIndex: id,         // Currently viewed tournament
  user: FirebaseUser | false,         // Logged-in user
  isAdmin: boolean,                   // Admin access (portal import)
  savedTournaments: { [id]: Tournament },  // Archived
  message: { show, type, title, text }     // Toast notifications
}
```

## Sync Pattern

Specific store actions trigger automatic Firebase sync:
```javascript
actionsRequiringSync = [
  'savePreferences', 'saveTournamentData', 'finishTournament',
  'changeTournamentName', 'setPlayOffStage', 'setPlayOffBracket',
  'setPlayOff', 'setCadrage', 'saveCadrageScores', 'restoreRound',
  'addRoundToGames', 'endRound', 'startRound', 'shuffleLanesStore'
]
```

Each syncs the entire current tournament object to Firebase via `update()`.
