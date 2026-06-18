# Task 1: Store Actions — Replace syncToFirebase in main.js ✅

## Scope

File: `src/stores/main.js`

Replace 5 `syncToFirebase()` calls in store actions with specific `_syncPath()` calls.

## Changes Required

### 1. `shuffleLanesStore()` (line 427-433)

**Currently:** Mutates games + teams, then `syncToFirebase()` (full tournament).

**Change to:**
```js
shuffleLanesStore(games) {
  this.tournaments[this.currentTournamentIndex].games[
    this.tournaments[this.currentTournamentIndex].games.length - 1
  ] = games;
  this.tournaments[this.currentTournamentIndex].teams.forEach((team) => team.lanes.pop());
  this.saveLanesToTeams(games);
  this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
  this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
},
```

### 2. `swapLanesStore()` (line 435-447)

**Currently:** Swaps two games' positions + lanes, then `syncToFirebase()`.

**Change to:**
```js
swapLanesStore({ roundIndex, indexA, indexB }) {
  const games = this.tournaments[this.currentTournamentIndex].games[roundIndex];
  const temp = games[indexA];
  games[indexA] = games[indexB];
  games[indexB] = temp;
  const tempLane = games[indexA].lane;
  games[indexA].lane = games[indexB].lane;
  games[indexB].lane = tempLane;
  this.tournaments[this.currentTournamentIndex].teams.forEach((team) => {
    if (team.lanes) team.lanes.pop();
  });
  this.saveLanesToTeams(games);
  this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
  this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
},
```

### 3. `addRoundToGames()` (line 620-628)

**Currently:** Pushes new round, sets roundIsActive, saves lanes, then `syncToFirebase()`.

**Change to:**
```js
addRoundToGames(round) {
  if (!this.tournaments[this.currentTournamentIndex].games) {
    this.tournaments[this.currentTournamentIndex].games = [];
  }
  this.tournaments[this.currentTournamentIndex].games.push(round);
  this.tournaments[this.currentTournamentIndex].roundIsActive = true;
  this._roundActivatedAt = Date.now();
  this.saveLanesToTeams(round);
  this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
  this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
  this._syncPath('roundIsActive', true);
},
```

### 4. `restoreRound()` (line 630-634)

**Currently:** Pops last round + opponent/lane data, then `syncToFirebase()`.

**Change to:**
```js
restoreRound() {
  this.tournaments[this.currentTournamentIndex].games.pop();
  this.tournaments[this.currentTournamentIndex].teams.forEach((team) => team.opponents.pop());
  this.tournaments[this.currentTournamentIndex].teams.forEach((team) => team.lanes.pop());
  this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
  this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
},
```

### 5. `addTournament()` (line 686-704)

**Keep as-is.** Creating a new tournament legitimately needs to sync the full object since the entire tournament is new. This is the one valid use case for `syncToFirebase()`.

## Test Plan

1. **Shuffle lanes:** Start a round → shuffle lanes → verify in Firebase console that only `games` and `teams` paths are written
2. **Swap lanes:** Start a round → swap two lanes → verify only `games` and `teams` paths update
3. **Draw round:** Draw a new round → verify `games`, `teams`, `roundIsActive` paths update (not full tournament)
4. **Restore round:** Restore a round → verify `games` and `teams` paths update
5. **Multi-admin:** Open two tabs, draw a round in tab 1 → verify tab 2 receives the update via merge logic
6. **Public view:** Open public view → perform actions above → verify public view updates correctly

## Implementation Summary

| Method | Was | Now |
|--------|-----|-----|
| `shuffleLanesStore()` | `syncToFirebase()` | `_syncPath('games')` + `_syncPath('teams')` |
| `swapLanesStore()` | `syncToFirebase()` | `_syncPath('games')` + `_syncPath('teams')` |
| `addRoundToGames()` | `syncToFirebase()` | `_syncPath('games')` + `_syncPath('teams')` + `_syncPath('roundIsActive')` |
| `restoreRound()` | `syncToFirebase()` | `_syncPath('games')` + `_syncPath('teams')` |
| `addTournament()` | `syncToFirebase()` | **kept as-is** (new tournament) |

## Notes

- `saveLanesToTeams()` mutates teams in place, so we sync teams after calling it
- `addTournament()` stays unchanged — full sync is correct for a brand-new tournament
- `saveTournamentData()` (line 754) also calls `syncToFirebase()` — this is the manual "save" button, can stay as safety fallback for now
