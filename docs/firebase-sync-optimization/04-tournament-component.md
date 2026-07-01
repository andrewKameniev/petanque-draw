# Task 4: Tournament Component — Replace syncToFirebase with granular syncs

## Scope

File: `src/components/Tournament.vue`

Replace 5 `syncToFirebase()` calls with specific path syncs.

## Changes Required

### 1. `onMessageInput()` (line 446)

**Currently:** Syncs full tournament when organizer types a message.

**Change to:**

```js
onMessageInput() {
  this._syncPath('tournamentMessage', this.tournament.tournamentMessage);
},
```

**Note:** Need to add `_syncPath` to mapActions or create a `syncTournamentMessage()` store action.

### 2. `drawFirstRound()` — TIR start (line 605)

**Currently:** Sets tirStarted, tirParticipants, tirConfig, tirRound, pushes empty games, then `syncToFirebase()`.

**Change to:**

```js
// After all mutations:
this._syncPath('tirStarted', true);
this._syncPath('tirParticipants', this.tournament.tirParticipants);
this._syncPath('tirConfig', this.tournament.tirConfig);
this._syncPath('tirRound', 1);
this._syncPath('games', this.tournament.games);
```

Or better, create a store action `startTirTournament()` that encapsulates this.

### 3. `drawFirstRound()` — Swiss/Groups/Poules start (line 686)

**Currently:** After preferences are saved and round is added, calls `syncToFirebase()`.

**Analysis:** This is redundant because:

- `savePreferences()` already calls `_syncPath('preferences', ...)`
- `addRoundToGames()` (after Task 1) will sync `games`, `teams`, `roundIsActive`

**Change to:** Remove the `syncToFirebase()` call entirely. The preceding actions already sync everything needed.

Additional paths that need syncing (set earlier in the method):

```js
// If groups system:
this._syncPath('groups', this.tournament.groups);
this._syncPath('groupsScheme', this.tournament.groupsScheme);
this._syncPath('groupSchedule', this.tournament.groupSchedule);

// If poules system:
this._syncPath('groups', this.tournament.groups);
this._syncPath('poulesRound', this.tournament.poulesRound);
```

### 4. `syncToFirebaseNow()` in `redrawRounds()` (line 736)

**Currently:** After redrawing all rounds from scratch (destructive reset), syncs full tournament.

**Analysis:** This is a structural change — teams are reset, games regenerated, roundIsActive/tournamentIsStarted cleared. Multiple top-level fields change.

**Change to:**

```js
this._syncPath('games', this.tournament.games);
this._syncPath('teams', this.tournament.teams);
this._syncPath('roundIsActive', false);
this._syncPath('tournamentIsStarted', false);
this._syncPath('groupSchedule', this.tournament.groupSchedule);
this._syncPath('groupsScheme', this.tournament.groupsScheme);
this._syncPath('groups', this.tournament.groups);
```

### 5. `autoFillScores()` (line 741)

**Currently:** Auto-fills scores for testing, then `syncToFirebase()`.

**Change to:**

```js
autoFillScores() {
  autoFillScoresFn(this.tournament, this.activeRound);
  this._syncPath('games', this.tournament.games);
},
```

## New Store Actions Needed

Option A — Expose `_syncPath` to components via a generic action:

```js
syncPath(path, data) {
  this._syncPath(path, data);
},
```

Option B — Create specific actions for each path (preferred for type safety):

```js
syncTournamentMessage(message) {
  this._syncPath('tournamentMessage', message);
},
syncTirStart() {
  const t = this.tournaments[this.currentTournamentIndex];
  this._syncPath('tirStarted', true);
  this._syncPath('tirParticipants', t.tirParticipants);
  this._syncPath('tirConfig', t.tirConfig);
  this._syncPath('tirRound', t.tirRound);
  this._syncPath('games', t.games);
},
```

## Test Plan

1. **Tournament message:** Type a message → verify only `tournamentMessage` path updates
2. **First round draw (Swiss):** Draw first round → verify `games`, `teams`, `roundIsActive`, `preferences` update (not full tournament)
3. **First round draw (TIR):** Start TIR → verify only tir-specific paths update
4. **Redraw:** Redraw rounds → verify specific paths update
5. **Auto-fill:** Auto-fill scores → verify only `games` updates
6. **Public view:** Verify all above reflect correctly on public view

## Notes

- `onMessageInput()` is called on every keystroke (via v-model + watcher). Consider debouncing the sync — `_syncMatchDebounced('tournamentMessage', '', message)` or a custom debounce.
- `drawFirstRound()` is complex with many code paths. Each system type (swiss, groups, poules, tir, supermele) mutates different fields. Handle each path.
- `redrawRounds()` uses `syncToFirebaseNow()` (no debounce) for good reason — it's a destructive action that should propagate immediately. Keep immediate sync but path-specific.
