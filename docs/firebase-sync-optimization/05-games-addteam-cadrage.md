# Task 5: Games, AddTeam & Cadrage — Replace syncToFirebase ✅

## Scope

Files:
- `src/components/partials/Games.vue` — 4 calls
- `src/components/partials/AddTeam.vue` — 2 calls
- `src/components/partials/Cadrage.vue` — 1 call

## Changes Required

### Games.vue

#### 1. `finishRound()` → `syncToFirebaseNow()` (line 530)

**Currently:** After saving all round results (recalculating rankings), calls `syncToFirebaseNow()`.

**Analysis:** At round end, `games` and `teams` (with updated stats) both change. `endRound()` and `clearRoundTimer()` already sync their own paths.

**Change to:**
```js
this.clearRoundTimer();
this.endRound();
this._syncPath('games', this.tournament.games);
this._syncPath('teams', this.tournament.teams);
```

Note: Use a non-debounced sync here (the existing `_syncPath` is already non-debounced — it calls `set()` directly).

#### 2. `restoreRoundGames()` — cadrage removal (line 673)

**Currently:** Deletes `playOff`, `playOffBracket`, `playOffStage` from tournament, then `syncToFirebase()`.

**Change to:**
```js
delete this.tournament.playOff;
delete this.tournament.playOffBracket;
delete this.tournament.playOffStage;
this._syncPath('playOff', null);
this._syncPath('playOffBracket', null);
this._syncPath('playOffStage', null);
```

#### 3. `restoreRoundGames()` — barrage removal (line 699)

**Currently:** Deletes `barrage` from tournament, then `syncToFirebase()`.

**Change to:**
```js
delete this.tournament.barrage;
this._syncPath('barrage', null);
```

#### 4. `restoreRoundGames()` — full playoff removal (line 673 else branch)

**Currently:** Deletes `playOff`, `playOffBracket`, `playOffStage`, `cadrage`, then `syncToFirebase()` (implicitly via other path).

**Analysis:** This branch already calls `startRound()` which syncs `roundIsActive`. Just need to sync the deletions:

```js
delete this.tournament.playOff;
delete this.tournament.playOffBracket;
delete this.tournament.playOffStage;
delete this.tournament.cadrage;
this._syncPath('playOff', null);
this._syncPath('playOffBracket', null);
this._syncPath('playOffStage', null);
this._syncPath('cadrage', null);
```

### AddTeam.vue

#### 5. `addTeam()` (line 125)

**Currently:** Pushes team to array, then `syncToFirebase()`.

**Change to:**
```js
this.addTeamToStore(team);
this.syncTeams();
```

Where `syncTeams()` is the existing store action that calls `_syncPath('teams', ...)`.

#### 6. `importList()` (line 159)

**Currently:** After importing all teams from portal, calls `syncToFirebase()`.

**Analysis:** By this point, `addTeam()` has been called for each team (each already syncing). The final `syncToFirebase()` is redundant if we ensure teams are synced once at the end.

**Change to:**
```js
// After forEach loop completes:
this.syncTeams();
```

Remove the individual `syncToFirebase()` from inside `addTeam()` when called from `importList()`. Or simply: let `addTeam()` sync teams each time (it's fine — Firebase coalesces rapid writes), and remove the extra `syncToFirebase()` at line 159.

#### 4. `startTeamPlayoff()` (line 781)

**Currently:** Builds `teamPlayoff` structure, then `syncToFirebase()`.

**Changed to:** `this.syncTeamPlayoff()`

### Cadrage.vue

#### 5. `swapCadrageLane()` (line 62)

**Currently:** Swaps two cadrage lanes, then `syncToFirebase()`.

**Changed to:** `this.syncCadrageFull()`

## Store Actions Added

```js
syncGamesAndTeams() {
  this._syncPath('games', this.tournaments[this.currentTournamentIndex].games);
  this._syncPath('teams', this.tournaments[this.currentTournamentIndex].teams);
},
syncTeamPlayoff() {
  this._syncPath('teamPlayoff', this.tournaments[this.currentTournamentIndex].teamPlayoff);
},
syncCadrageFull() {
  this._syncPath('cadrage', this.tournaments[this.currentTournamentIndex].cadrage);
},
syncPathNull(path) {
  this._syncPath(path, null);
},
```

## Implementation Summary

| Component | Method | Was | Now |
|-----------|--------|-----|-----|
| Games.vue | `finishRound()` | `syncToFirebaseNow()` | `syncGamesAndTeams()` |
| Games.vue | `restoreRoundGames()` (cadrage branch) | `syncToFirebase()` | `syncPathNull('playOff/playOffBracket/playOffStage')` |
| Games.vue | `restoreRoundGames()` (full playoff branch) | implicit via `startRound()` | `syncPathNull('playOff/playOffBracket/playOffStage/cadrage')` |
| Games.vue | `restoreRoundGames()` (barrage branch) | `syncToFirebase()` | `syncPathNull('barrage')` |
| Games.vue | `startTeamPlayoff()` | `syncToFirebase()` | `syncTeamPlayoff()` |
| AddTeam.vue | `addTeam()` | `syncToFirebase()` | `syncTeams()` |
| AddTeam.vue | `importList()` | `syncToFirebase()` | `syncTeams()` |
| Cadrage.vue | `swapCadrageLane()` | `syncToFirebase()` | `syncCadrageFull()` |

## Test Plan

1. **Finish round:** Complete all scores → save results → verify `games` and `teams` paths update (not full tournament)
2. **Restore round (with playoff):** Restore a round during playoff → verify playoff paths are set to null
3. **Restore round (with barrage):** Restore during barrage → verify `barrage` path set to null
4. **Add team:** Add a single team → verify only `teams` path updates
5. **Import teams:** Import from portal → verify only `teams` + `name` + `date` paths update
6. **Cadrage lane swap:** Swap cadrage lanes → verify only `cadrage` path updates
7. **Start team playoff:** Start team playoff from groups → verify only `teamPlayoff` path updates
8. **Multi-admin:** Two tabs, both in games view → one finishes round → verify other tab merges correctly
