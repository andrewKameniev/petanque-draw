# Firebase Sync Optimization Plan

## Problem Statement

The app currently over-sends data to Firebase Realtime Database. The method `syncToFirebase()` sends the **entire tournament object** on almost every admin action, even when only a single field changed. For a 60-team tournament with 5+ rounds, this means sending 50-150 KB when only 200 bytes actually changed — a **500-750x overhead** on the most frequent operations.

Additionally, the admin subscription listens to the entire tournament node, receiving full snapshots back even for single-field changes by co-admins.

## Current Architecture

### Two sync mechanisms exist:

1. **`_syncPath(path, data)`** — Sends a single property to `{uid}/tournaments/{id}/{path}`. Efficient, granular.
2. **`syncToFirebase()` → `_doSync()`** — Sends the entire tournament via `update(ref, {[id]: fullObject})`. Expensive, wasteful.

### Subscription:

- **Admin view** (`subscribeTournament()`) — Single `onValue()` on the whole tournament node. Every sub-path write triggers a full snapshot download.
- **Public view** (`_subscribeDynamic()`) — Per-path `subscribePath()` listeners. Already efficient.

## Solution Overview

Replace `syncToFirebase()` with specific `_syncPath()` calls everywhere. Each caller knows exactly what changed — we just need to sync that specific data instead of the full object.

## Architecture After Optimization

```
Admin Action (e.g., score entry)
  └── _syncPath('games/4/2', gameData)     // ~200 bytes
        └── Firebase set() on specific path
              └── Triggers subscribePath('games') on Public view
              └── Triggers subscribePath('games') on other admins (Task 6)
```

vs. current:

```
Admin Action (e.g., score entry)
  └── syncToFirebase()                     // ~100 KB full tournament
        └── Firebase update() on tournament root
              └── Triggers onValue() with full snapshot on ALL listeners
```

## Tasks

Each task is independent and can be completed in any order (except Task 6 depends on all others being done first).

**Recommended order: 3 → 1 → 5 → 2 → 4 → 6 → 7**

| #   | Status | Task                                                       | File                                        | Scope                            | Impact                                          |
| --- | ------ | ---------------------------------------------------------- | ------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| 1   | ✅     | [Store actions](./01-store-actions.md)                     | `src/stores/main.js`                        | 5 syncToFirebase calls           | High — affects addRound, shuffle, swap, restore |
| 2   | ✅     | [TirModule](./02-tir-module.md)                            | `src/components/tir/TirModule.vue`          | 10 syncToFirebase calls          | High — most frequent during tir tournaments     |
| 3   | ✅     | [StreamPresets](./03-stream-presets.md)                    | `src/components/partials/StreamPresets.vue` | 6 syncToFirebase calls           | Medium — stream overlay config                  |
| 4   | ✅     | [Tournament component](./04-tournament-component.md)       | `src/components/Tournament.vue`             | 5 syncToFirebase calls           | Medium — draw, redraw, tir start                |
| 5   | ✅     | [Games & AddTeam & Cadrage](./05-games-addteam-cadrage.md) | Multiple components                         | 7 syncToFirebase calls           | Medium — score save, team add, restore          |
| 6   | ✅     | [Admin subscription](./06-admin-subscription.md)           | `src/stores/main.js`                        | subscribeTournament() rewrite    | High — eliminates full snapshot downloads       |
| 7   | ✅     | [Cleanup & validation](./07-cleanup.md)                    | All files                                   | Remove dead code, add safety net | Low — final polish                              |

> Mark tasks as ✅ when complete, ⬜ when pending.

## Guiding Principles

1. **No behavior change** — Every action must produce the same Firebase state as before
2. **One task at a time** — Each task is self-contained with its own test plan
3. **Keep `syncToFirebase()` available** — Don't delete it until all callers are migrated; it remains as emergency fallback
4. **Match existing patterns** — `_syncPath` and `_syncMatchDebounced` already work correctly; reuse them
5. **Test multi-admin** — After each task, verify two admins editing simultaneously still merge correctly

## How to Verify

After each task:

1. Open the tournament in two browser tabs (same account simulates multi-admin)
2. Perform the action that was changed
3. Open Firebase console → Database → observe only the specific path is written
4. Confirm the second tab receives and merges the update correctly
5. Confirm the Public view updates correctly

## Estimated Savings Per Action

| Action             | Before  | After  | Reduction |
| ------------------ | ------- | ------ | --------- |
| Enter game score   | ~100 KB | ~200 B | 500x      |
| Add team           | ~100 KB | ~2 KB  | 50x       |
| Start/end round    | ~100 KB | ~50 B  | 2000x     |
| TIR score update   | ~100 KB | ~5 KB  | 20x       |
| Stream preset edit | ~100 KB | ~1 KB  | 100x      |
| Shuffle lanes      | ~100 KB | ~10 KB | 10x       |
