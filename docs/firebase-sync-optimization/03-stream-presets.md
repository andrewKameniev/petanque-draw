# Task 3: StreamPresets — Replace syncToFirebase with _syncPath ✅

## Scope

File: `src/components/partials/StreamPresets.vue`

Replace 6 `syncToFirebase()` calls with a single targeted `_syncPath('streamPresets', ...)`.

## Problem

Every stream preset edit (add/update/remove a team or lane stream URL) sends the entire tournament (~100 KB) when only the `streamPresets` sub-object (~200-500 bytes) changed.

## New Store Action Needed

Add to `src/stores/main.js`:

```js
syncStreamPresets() {
  this._syncPath('streamPresets', this.tournaments[this.currentTournamentIndex].streamPresets);
},
```

## Changes Required

Replace all 6 `this.syncToFirebase()` calls in StreamPresets.vue with `this.syncStreamPresets()`:

### 1. `addTeamStream()` (line 121)
### 2. `updateTeamStream()` (line 127)
### 3. `removeTeamStream()` (line 137)
### 4. `addLaneStream()` (line 147)
### 5. `updateLaneStream()` (line 154)
### 6. `removeLaneStream()` (line 165)

All follow the same pattern — mutate `tournament.streamPresets`, then sync just that path.

## Updated mapActions

```js
...mapActions(useMainStore, ['syncStreamPresets']),
```

## Test Plan

1. **Add team stream:** Add a stream URL to a team → verify only `streamPresets` path updates in Firebase
2. **Update team stream:** Change the URL → verify only `streamPresets` updates
3. **Remove team stream:** Remove a URL → verify only `streamPresets` updates
4. **Lane streams:** Repeat above for lane streams
5. **Public view:** Open public/stream view → add/change stream in admin → verify it updates on public

## Impact

Low frequency (stream presets are configured once per tournament), but very straightforward fix — all 6 calls are identical in what they should sync.
