# Firebase Integration

## Services Used

- **Firebase Auth** — Email/password authentication
- **Firebase Realtime Database** — All app data storage
- **Firebase Cloud Messaging** — Push notifications to viewers
- **Cloud Functions** — `sendMessage` endpoint for triggering notifications

## Database Structure

```
root/
├── {userId}/
│   ├── tournaments/
│   │   └── {tournamentId}/      # Tournament object (see below)
│   ├── saved/
│   │   └── {tournamentId}/      # Archived tournament snapshots
│   ├── stats/
│   │   ├── tags/                # User's stat tags
│   │   └── {timestamp}/         # Individual game stat records
│   └── training/
│       └── list/
│           └── {exerciseId}/    # Exercise definitions + results
├── tokens/
│   └── {userId}/
│       └── {tournamentId}/      # FCM tokens for push notifications
└── apikey                       # VAPID key for FCM
```

## Tournament Object

```json
{
  "id": 1234567890,
  "name": "Tournament A",
  "system": "swiss|groups|supermele",
  "teams": [{ "title", "rating", "players", "wins", "buhgolts", "smallBuhgolts", "pointsPlus", "pointsMinus", "opponents", "lanes" }],
  "games": [[ { "team_1", "team_1_score", "team_2", "team_2_score", "lane" } ]],
  "gamesCopy": [],
  "roundIsActive": false,
  "useRating": false,
  "playoff": false,
  "isCadrage": false,
  "supermelePlayers": 2,
  "tournamentIsFinished": false,
  "tournamentMessage": "",
  "preferences": {
    "technical": { "technicalFirst": 13, "technicalSecond": 7 },
    "maxScore": 13,
    "playOffTeams": 8,
    "fieldsStart": 1
  }
}
```

## Auth Flow

1. User registers or logs in via `LoginUser.vue`
2. `onAuthStateChanged` in `Draw.vue` detects auth state
3. On login: user object stored in Vuex, tournaments fetched from DB
4. All DB operations use `{user.uid}` as root path

## Realtime Sync

The Vuex store uses `store.subscribe()` to auto-save after specific mutations:

- `savePreferences`, `saveTournamentData`, `finishTournament`
- `changeTournamentName`, `setPlayOffStage`, `setPlayOffBracket`
- `setPlayOff`, `setCadrage`, `saveCadrageScores`
- `restoreRound`, `addRoundToGames`
- `endRound`, `startRound`, `shuffleLanesStore`

## Push Notifications

1. Public viewer opens shared link → browser requests notification permission
2. On grant: FCM token generated and stored in `tokens/{userId}/{tournamentId}`
3. Organizer clicks "Send notification" → reads tokens → calls Cloud Function
4. Cloud Function sends FCM messages to all stored tokens
