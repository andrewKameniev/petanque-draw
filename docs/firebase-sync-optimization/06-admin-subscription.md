# Task 6: Admin Subscription — Switch to Per-Path Listeners

## Scope

File: `src/stores/main.js` — `subscribeTournament()` method (lines 193-241)

Replace the single whole-tournament `onValue()` listener with per-path `onValue()` listeners, matching the pattern already used by Public.vue.

## Problem

Currently the admin subscribes to the **entire tournament node**:

```js
const dbRef = ref(db, `${this.user.uid}/tournaments/${this.currentTournamentIndex}`);
this._tournamentUnsubscribe = onValue(dbRef, (snapshot) => { ... });
```

This means:

1. Every `_syncPath('games/0/1', gameData)` by a co-admin triggers a **full snapshot download** of the entire tournament
2. The admin receives ~100 KB on every remote change, even if only 200 bytes changed
3. Firebase charges for bytes downloaded — this multiplies bandwidth costs by 500x+

## Solution

Subscribe to individual paths (same as `_subscribeDynamic()` in Public.vue), but with the existing merge logic:

```js
subscribeTournament() {
  this.unsubscribeTournament();
  if (!this.user || !this.user.uid || !this.currentTournamentIndex) return;
  const db = getDatabase();
  const basePath = `${this.user.uid}/tournaments/${this.currentTournamentIndex}`;
  this._tournamentUnsubscribers = [];

  const subscribePath = (path, handler) => {
    const dbRef = ref(db, `${basePath}/${path}`);
    const unsub = onValue(dbRef, (snapshot) => {
      if (this._recentSyncPaths?.has(path)) {
        this._recentSyncPaths.delete(path);
        return;
      }
      const local = this.tournaments[this.currentTournamentIndex];
      if (!local) return;
      handler(snapshot.val(), local);
    });
    this._tournamentUnsubscribers.push(unsub);
  };

  // Games — merge only active round
  subscribePath('games', (remoteGames, local) => {
    if (!remoteGames || !local.games || !local.roundIsActive) return;
    this._mergeGames(local, { games: remoteGames });
  });

  // Cadrage — merge with editing check
  subscribePath('cadrage', (remoteCadrage, local) => {
    if (!remoteCadrage || !local.cadrage) return;
    this._mergeCadrage(local, { cadrage: remoteCadrage });
  });

  // Playoff brackets — merge with editing check
  subscribePath('playOffBracket', (remoteBracket, local) => {
    if (!remoteBracket || !local.playOffBracket) return;
    this._mergeBracketPlayoff(local, { playOffBracket: remoteBracket });
  });

  // TIR playoff — merge with editing check
  subscribePath('tirPlayoff', (remotePlayoff, local) => {
    if (!remotePlayoff) return;
    if (!local.tirPlayoff) {
      local.tirPlayoff = remotePlayoff;
      return;
    }
    this._mergeTirPlayoff(local, { tirPlayoff: remotePlayoff });
  });

  // Team playoff — merge with editing check
  subscribePath('teamPlayoff', (remotePlayoff, local) => {
    if (!remotePlayoff) return;
    if (!local.teamPlayoff) {
      local.teamPlayoff = remotePlayoff;
      return;
    }
    this._mergeTeamPlayoff(local, { teamPlayoff: remotePlayoff });
  });

  // Simple replace paths — no merge needed
  const simplePaths = [
    'tirParticipants', 'tirRound', 'tirR2Participants',
    'tirTiebreakerCount', 'tirTiebreakerActive', 'tirTiebreakerParticipantIds',
    'roundTimer', 'tournamentIsFinished', 'tournamentMessage',
    'teams', 'preferences', 'streamPresets', 'playOff', 'playOffStage',
    'barrage', 'tirStarted',
  ];

  simplePaths.forEach((path) => {
    subscribePath(path, (value, local) => {
      if (value !== undefined) local[path] = value;
    });
  });

  // roundIsActive — special handling (debounce for local activation)
  subscribePath('roundIsActive', (value, local) => {
    if (value !== undefined && !value && local.roundIsActive) {
      if (!this._roundActivatedAt || Date.now() - this._roundActivatedAt > 3000) {
        local.roundIsActive = value;
      }
    }
  });
},

unsubscribeTournament() {
  if (this._tournamentUnsubscribers) {
    this._tournamentUnsubscribers.forEach((fn) => fn());
    this._tournamentUnsubscribers = null;
  }
  // Keep old cleanup for backward compat during migration
  if (this._tournamentUnsubscribe) {
    this._tournamentUnsubscribe();
    this._tournamentUnsubscribe = null;
  }
},
```

## Echo Prevention

Currently, echo prevention uses `_lastFullSyncAt` timestamp. With per-path sync, we need per-path echo prevention:

**Option A — Track recently synced paths:**

```js
_syncPath(path, data) {
  if (!this._recentSyncPaths) this._recentSyncPaths = new Set();
  this._recentSyncPaths.add(path.split('/')[0]); // Track top-level path
  // ... existing set() call
},
```

The listener checks `_recentSyncPaths` and skips if present (cleared on next tick or after 1s timeout).

**Option B — Timestamp per path (more robust):**

```js
_syncPath(path, data) {
  if (!this._pathSyncTimestamps) this._pathSyncTimestamps = {};
  const topPath = path.split('/')[0];
  this._pathSyncTimestamps[topPath] = Date.now();
  // ... existing set() call
},
```

Listener checks: `if (Date.now() - this._pathSyncTimestamps[path] < 1000) return;`

## Dependencies

This task should be done **after** Tasks 1-5 are complete, because:

1. Once all callers use `_syncPath()`, the echo prevention can be path-based
2. The `_lastFullSyncAt` / `_doSync()` pattern becomes unused
3. The old single-listener approach can be fully removed

## Test Plan

1. **Basic receive:** Open two admin tabs → change score in tab 1 → verify tab 2 receives only the affected path
2. **Echo prevention:** Change score → verify the same tab doesn't echo-update from its own write
3. **Merge logic:** Two admins edit different games simultaneously → verify both scores appear correctly
4. **Playoff merge:** Two admins edit different playoff matches → verify merge logic works
5. **TIR merge:** Two admins score different participants → verify no data loss
6. **Connection drop:** Disconnect/reconnect → verify state catches up via per-path listeners
7. **Firebase console:** Monitor bandwidth — verify only changed paths are downloaded

## Impact

This is the **reception side** optimization. After Tasks 1-5 reduce what's sent, this task reduces what's downloaded. Combined effect:

- Before: Send 100 KB + Receive 100 KB = 200 KB per action
- After: Send 200 B + Receive 200 B = 400 B per action

For a tournament with 2 active admins entering scores simultaneously, this reduces Firebase bandwidth from ~20 MB/hour to ~40 KB/hour.

## Risks

- More listeners = more Firebase connections (but Firebase handles this efficiently)
- Per-path listeners might miss cross-path consistency (e.g., `games` and `teams` update atomically with full sync, but separately with per-path). Mitigation: the UI already handles eventual consistency via merge logic.
- Need to handle the case where a path doesn't exist yet (initial tournament load). Solution: initial load via `get()` remains unchanged; per-path listeners only handle updates.
