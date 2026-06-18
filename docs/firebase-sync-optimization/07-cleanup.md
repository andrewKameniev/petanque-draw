# Task 7: Cleanup & Validation

## Scope

All files. Final pass after Tasks 1-6 are complete.

## Actions

### 1. Audit remaining `syncToFirebase()` calls

Run:
```bash
grep -rn "syncToFirebase\|syncToFirebaseNow" src/ --include="*.vue" --include="*.js"
```

Expected remaining valid uses:
- `addTournament()` — new tournament, full sync is correct
- `saveTournamentData()` — manual save button, keep as safety net
- `Tournament.vue` — 5 calls (handled by Task 4)

Dead imports to remove:
- `TeamPlayoff.vue` line 194 — imports `syncToFirebase` but never calls it

All others should be gone. If any remain, evaluate whether they can be replaced.

### 2. Remove `_doSync()` timeout logic

Once no component calls `syncToFirebase()` in normal flow:
- Keep `syncToFirebase()` and `_doSync()` as a fallback but add a console warning:
```js
syncToFirebase() {
  if (import.meta.env.DEV) {
    console.warn('[perf] syncToFirebase() called — consider using _syncPath() instead');
  }
  clearTimeout(this._syncTimeout);
  this._syncTimeout = setTimeout(() => this._doSync(), 300);
},
```

### 3. Remove old subscription code

After Task 6 is verified:
- Remove `_lastFullSyncAt` logic
- Remove the old single `onValue()` in `subscribeTournament()`
- Remove `syncToFirebaseNow()` if no callers remain

### 4. Remove `syncGames()` full array sync

The store action `syncGames()` (line 567) sends the entire `games` array. Check if any callers remain:
```bash
grep -rn "syncGames" src/ --include="*.vue" --include="*.js"
```

If unused after Tasks 1-5, remove it. The individual `syncGameMatch()` pattern is always preferred.

### 5. Validate AddTeam import efficiency

During `importList()`, `addTeam()` is called in a loop. Each call currently syncs the full teams array. Consider batching:

```js
async importList() {
  // ... fetch teams ...
  importedList.teams.forEach((team) => {
    this.addTeamToStore(team); // Just pushes to array, no sync
  });
  this.syncTeams(); // Single sync after all teams added
  this.setTournamentInfoFromPortal(importedList.tournament);
  this.setTournamentIdFromPortal(this.tournamentId);
},
```

### 6. Add `_syncPath` call batching (optional optimization)

For actions that sync multiple paths simultaneously (e.g., `games` + `teams` + `roundIsActive`), consider using Firebase `update()` with multiple paths in one call:

```js
_syncMultiplePaths(paths) {
  if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
  const db = getDatabase();
  const basePath = `${this.user.uid}/tournaments/${this.currentTournamentIndex}`;
  const updates = {};
  for (const [path, data] of Object.entries(paths)) {
    const plain = data != null && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data;
    updates[`${basePath}/${path}`] = plain;
  }
  return update(ref(db), updates).catch((error) => {
    console.error('Error updating paths:', error);
  });
},
```

Usage:
```js
addRoundToGames(round) {
  // ... mutations ...
  this._syncMultiplePaths({
    games: this.tournaments[this.currentTournamentIndex].games,
    teams: this.tournaments[this.currentTournamentIndex].teams,
    roundIsActive: true,
  });
},
```

This is atomic — all paths update together or none do.

### 7. Firebase Security Rules (optional)

If Firebase rules currently allow writes only at the tournament root level, they may need updating to allow writes at sub-paths. Check `.rules` or Firebase console.

## Test Plan

1. **Full tournament flow:** Create tournament → add teams → draw rounds → enter scores → finish → verify no full-tournament syncs occur (except tournament creation)
2. **Dev console:** Run app in dev mode → verify no `[perf] syncToFirebase()` warnings appear during normal operations
3. **Firebase bandwidth:** Compare Firebase console bandwidth metrics before/after
4. **Regression:** Run full e2e test suite to verify no functionality broken

## Definition of Done

- [ ] No unnecessary `syncToFirebase()` calls remain in normal flow
- [ ] Dev warning added for any remaining calls
- [ ] Old subscription cleanup code removed
- [ ] Firebase bandwidth reduced by 10x+ (measurable in Firebase console)
- [ ] All e2e tests pass
- [ ] Multi-admin editing works correctly
