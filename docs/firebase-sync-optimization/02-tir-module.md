# Task 2: TirModule — Replace syncToFirebase with granular syncs ✅

## Scope

File: `src/components/tir/TirModule.vue`

Replace 10 `syncToFirebase()` calls with specific `_syncPath()` calls via new store actions.

## Problem

TirModule is the **worst offender** — 10 separate calls to `syncToFirebase()` send the entire tournament object when only TIR-specific data changed. During active scoring, `onScoreUpdate()` fires on every throw, sending ~100 KB per single button tap.

## New Store Actions Needed

Add these to `src/stores/main.js`:

```js
syncTirParticipants() {
  this._syncPath('tirParticipants', this.tournaments[this.currentTournamentIndex].tirParticipants);
},
syncTirState() {
  const t = this.tournaments[this.currentTournamentIndex];
  this._syncPath('tirRound', t.tirRound);
  this._syncPath('tirR2Participants', t.tirR2Participants || null);
  this._syncPath('tirTiebreakerActive', t.tirTiebreakerActive || false);
  this._syncPath('tirTiebreakerCount', t.tirTiebreakerCount || null);
  this._syncPath('tirTiebreakerParticipantIds', t.tirTiebreakerParticipantIds || null);
},
syncTirPlayoff() {
  this._syncPath('tirPlayoff', this.tournaments[this.currentTournamentIndex].tirPlayoff);
},
```

## Changes Required

### 1. `startTiebreaker()` (line 1006)

**Currently:** Sets tiebreaker fields + `syncToFirebase()`

**Change to:** `this.syncTirParticipants()` + `this.syncTirState()`

### 2. `finishTiebreaker()` (line 1011)

**Currently:** Clears tiebreaker active + `syncToFirebase()`

**Change to:** `this.syncTirState()`

### 3. `startRound2()` (line 1058)

**Currently:** Sets tirRound=2, tirR2Participants, inits scores2 + `syncToFirebase()`

**Change to:** `this.syncTirParticipants()` + `this.syncTirState()`

### 4. `returnToRound1()` (line 1064)

**Currently:** Resets tirRound=1, clears r2participants + `syncToFirebase()`

**Change to:** `this.syncTirState()`

### 5. `addParticipant()` (line 1091)

**Currently:** Pushes new participant + `syncToFirebase()`

**Change to:** `this.syncTirParticipants()`

### 6. `confirmLaneSwap()` (line 1116)

**Currently:** Swaps lane assignments between participants + `syncToFirebase()`

**Change to:** `this.syncTirParticipants()`

### 7. `onScoreUpdate()` (line 1164)

**Currently:** Called on every throw button tap + `syncToFirebase()`

**Change to:** `this.syncTirParticipants()`

**Optimization opportunity:** Could use debounced per-participant sync:

```js
onScoreUpdate() {
  this._syncMatchDebounced('tirParticipants',
    this.tirParticipants.indexOf(this.activeParticipant),
    this.activeParticipant
  );
},
```

### 8. `finishAtelier()` (line 1174)

**Currently:** Resets activeAtelier + `syncToFirebase()`

**Change to:** `this.syncTirParticipants()`

### 9. `startPlayoff()` (line 1254, builds tirPlayoff bracket)

**Currently:** Creates tirPlayoff structure + `syncToFirebase()`

**Change to:** `this.syncTirPlayoff()` + `this.syncTirParticipants()`

### 10. `finishPlayoffTournament()` (line 1330)

**Currently:** Sets tournamentIsFinished + `syncToFirebase()`

**Change to:** `this._syncPath('tournamentIsFinished', true)` — already has `finishTournament()` action in store that does exactly this. Use it directly:

```js
finishPlayoffTournament() {
  this.finishTournament();
},
```

## Test Plan

1. **Score entry:** Open TIR scoring → tap score buttons → verify only `tirParticipants` path updates in Firebase
2. **Tiebreaker flow:** Start tiebreaker → enter scores → finish → verify only tir-specific paths update
3. **Round 2:** Start round 2 → verify `tirRound` and `tirR2Participants` update
4. **Add participant:** Add a new participant → verify only `tirParticipants` updates
5. **Lane swap:** Swap lanes → verify only `tirParticipants` updates
6. **Playoff:** Start playoff → verify `tirPlayoff` path updates
7. **Multi-admin scoring:** Two tabs, each scoring different participant → verify merge works
8. **Public view:** Open public view → score in admin → verify public view updates

## Impact

This is the highest-frequency optimization. During active TIR scoring, multiple admins may be entering scores simultaneously (one per atelier). Each score tap currently sends ~100 KB; after this change it sends ~5 KB (full participants array) or ~500 bytes (per-participant debounced).

## Implementation Summary

| Method                      | Was                | Now                                                 |
| --------------------------- | ------------------ | --------------------------------------------------- |
| `startTiebreaker()`         | `syncToFirebase()` | `syncTirParticipants()` + `syncTirState()`          |
| `finishTiebreaker()`        | `syncToFirebase()` | `syncTirState()`                                    |
| `startRound2()`             | `syncToFirebase()` | `syncTirParticipants()` + `syncTirState()`          |
| `returnToRound1()`          | `syncToFirebase()` | `syncTirState()`                                    |
| `addParticipant()`          | `syncToFirebase()` | `syncTirParticipants()`                             |
| `confirmLaneSwap()`         | `syncToFirebase()` | `syncTirParticipants()`                             |
| `onScoreUpdate()`           | `syncToFirebase()` | `syncTirParticipants()`                             |
| `finishAtelier()`           | `syncToFirebase()` | `syncTirParticipants()`                             |
| `startPlayoff()`            | `syncToFirebase()` | `syncTirPlayoff()` + `syncTirParticipants()`        |
| `finishPlayoffTournament()` | `syncToFirebase()` | `finishTournament()` (reuses existing store action) |

## Notes

- The existing `syncTirPlayoffMatch()` store action already uses `_syncMatchDebounced` for playoff match scores — that pattern is correct and stays as-is
- `finishPlayoffTournament()` was simplified to just call the existing `finishTournament()` store action which already syncs only `tournamentIsFinished: true`
- Future optimization: `onScoreUpdate()` could use debounced per-participant sync for even less bandwidth
