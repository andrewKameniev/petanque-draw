# Task 4: Decompose the Main Pinia Store by Responsibility

## Goal

Reduce `src/stores/main.js` from a single store containing unrelated domains into clear model, persistence, synchronization, archive/collaboration, timer, and active-tournament responsibilities.

Preserve the existing `useMainStore` public API during the first stage wherever practical so this task does not require an application-wide rewrite.

## Problem

The main store currently owns:

- Tournament defaults and normalization
- Active group and tournament state
- Firebase reads, writes, subscriptions, and echo prevention
- Multi-admin merge/conflict behavior
- Round, lane, playoff, tir, and timer mutations
- Archive migration and restoration
- Collaborator/access management
- Global messages

The result is a 1,600+ line store with a large regression surface. Normalization is repeated in owned/shared/unarchive paths, while synchronization behavior is difficult to test separately from Pinia state.

## Dependencies

- Prefer completing Task 3 first so normalization and target selection already live in a canonical adapter.
- Coordinate with Task 5 if both tasks touch subscription utilities. Do not create two competing subscription abstractions.

## Relevant Files

- `src/stores/main.js`
- `src/services/db.js`
- `src/services/tournament-record.js` or equivalent from Task 3
- `src/firebase.js`
- `src/main.js`
- Every component using `useMainStore`
- `tests/user-map.test.js`
- `tests/archived-migration.test.js`
- `src/__tests__/group-b-store.spec.js`
- `src/__tests__/tournament-url-routing.spec.js`
- `src/__tests__/timer-ui.spec.js`
- Firebase sync optimization docs and related tests
- Tournament, group-B, tir, and authentication E2E suites

## Required Changes

### 1. Inventory the current store API

Before moving code, generate a list of:

- State fields
- Getters
- Actions
- Runtime-only private fields such as unsubscribe handles and debounce maps
- All production callers for every action/getter

Classify each item into one of these domains:

1. Tournament model/normalization
2. Active tournament editing
3. Firebase sync/subscriptions/merge
4. Archive and migration
5. Collaboration/access control
6. Timer state transitions
7. UI notifications

Do not delete apparently unused public actions without a repository-wide search and a test proving removal is safe.

### 2. Extract pure model and timer logic first

Move pure creation/normalization to the canonical tournament adapter from Task 3.

Move timer calculations and state transitions into a pure module, for example:

```js
createRoundTimer(tournament, now);
pauseRoundTimerState(timer, now);
resumeRoundTimerState(timer, now);
shouldSkipFinalTimer(tournament);
```

The store remains responsible for applying returned state and synchronizing it.

### 3. Extract Firebase synchronization infrastructure

Create a service/composable responsible for:

- `_syncPath`
- Debounced match writes
- Serialization to plain objects
- Subscription registration and cleanup
- Echo prevention
- Merge helpers for games, cadrage, single/double elimination, team playoff, and tir playoff
- Access-revoked callbacks

Keep merge policies explicit and independently testable. Do not hide mutable global state in the module.

### 4. Separate archive/collaboration behavior

Move archive loading, legacy `saved/` migration, archive/unarchive, collaborator management, and access watching into either:

- A dedicated `useArchiveStore`, or
- A focused archive service consumed by the façade store

Choose based on whether archive state must remain reactive across multiple views. Preserve owner/admin/scorer differences and owner UID path handling.

### 5. Preserve a façade during migration

Avoid changing every component in one step. `useMainStore` may delegate to extracted services/stores while retaining current action names.

Once callers and tests are stable, remove obsolete aliases in a separate cleanup step with explicit coverage.

### 6. Keep runtime resources lifecycle-safe

All timers, Firebase unsubscribe functions, access watchers, and debounced writes must have one owner and deterministic cleanup.

Document what happens when:

- Active tournament changes
- User logs out
- Shared access is revoked
- Component unmounts
- Network reconnects
- A pending debounce exists during tournament switching

## Affected Area and Required Regression Coverage

| Affected behavior                            | Existing coverage to retain                                                           | Required coverage audit/addition                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| New tournament defaults and active selection | `src/__tests__/group-b-store.spec.js`, `src/__tests__/tournament-url-routing.spec.js` | Add API-contract tests for every state/getter/action moved behind the façade.                                                                         |
| Group A/B mutation targeting                 | `src/__tests__/group-b-store.spec.js`                                                 | Retain target/prefix and all group-aware action scenarios before/after extraction.                                                                    |
| Owned/shared tournament loading              | `tests/user-map.test.js`, routing tests                                               | Cover success, missing data, permissions, logout, and active-tournament switching during pending work.                                                |
| Archive migration/load/restore               | `tests/archived-migration.test.js`, `tests/user-map.test.js`                          | Retain owner/admin/scorer and wrapper/legacy cases; add failed-write rollback/error cases if absent.                                                  |
| Collaborator add/remove/leave/access revoked | `tests/user-map.test.js` covers add and owner lookup                                  | Add missing remove, leave, watcher cleanup, permission-denied, and repeated-revocation cases.                                                         |
| Per-path writes and serialization            | Existing Firebase sync tests are indirect                                             | Add focused tests asserting exact paths and payloads for games, teams, preferences, timers, tir, playoffs, and group B.                               |
| Multi-admin merge behavior                   | Merge methods currently lack a complete dedicated suite                               | Add characterization tests for local-edit protection and remote merge for games, cadrage, bracket, double elimination, team playoff, and tir playoff. |
| Echo prevention/debounce                     | Indirectly exercised                                                                  | Add fake-timer tests for same-path echo, different-path updates, debounce replacement, success, failure, and cleanup.                                 |
| Timer start/pause/resume/end/clear           | `src/__tests__/timer-ui.spec.js` covers display behavior                              | Add pure timer-state tests and store integration tests, including no-timer finale and double-elimination finale.                                      |
| UI tournament lifecycle                      | Swiss/groups/group-B/tir E2E                                                          | Run representative end-to-end workflows, not only store tests.                                                                                        |
| Authentication and user switch               | `e2e/auth.spec.js`                                                                    | Verify subscriptions and private state are released when auth state changes.                                                                          |

### Baseline-before-refactor rule

Before moving production code:

1. Snapshot the store public API in a focused test.
2. Add missing merge, debounce, timer, collaborator, and cleanup characterization tests.
3. Run the affected unit/integration suites and representative E2E workflows.
4. Confirm the added tests pass against the existing monolithic store.
5. Record focused commands and any known unsupported scenarios.

After each extraction stage, run the same matrix. Do not wait until the entire store has moved.

## Unit and Integration Tests

Tests must cover:

1. Pure model normalization and timer transitions
2. Store façade compatibility
3. Exact Firebase path/payload writes
4. Subscription setup and deterministic cleanup
5. All merge families and local-edit guards
6. Echo prevention and debounce timing
7. Archive/collaborator owner-role differences
8. Access revoked and permission-denied behavior
9. Group A/B targeting
10. No state leakage when switching tournament/user

## E2E Tests

Run or add coverage for:

1. Create, rename, switch, and delete a tournament
2. Draw, score, restore, and finish a Swiss tournament
3. Create and operate tournament B
4. Tir score and playoff persistence after reload
5. Archive, open, restore, and delete an archive
6. Shared/admin tournament open and edit, if the environment supports the required accounts
7. Two pages editing different games to validate merge behavior
8. Logout/login without stale subscriptions or data from the previous user

Follow `e2e/README.md` and guarantee cleanup.

## Compatibility Constraints

- Preserve Firebase paths and record shape.
- Preserve store action/getter names during the façade stage.
- Preserve multi-admin merge semantics and granular writes.
- Preserve new and legacy tournament formats.
- Preserve owner/admin/scorer authorization behavior.
- Do not convert the whole application to a different state library.
- Do not silently change error handling or user-facing messages.

## Non-Goals

- Visual redesign
- Database migration
- Tournament-rule changes
- Composition API migration across all components
- Removing legacy support

## Verification

Run:

```bash
npm run lint
npm run test:run
npx playwright test e2e/tournament-management.spec.js e2e/swiss.spec.js e2e/group-b.spec.js e2e/tir.spec.js e2e/auth.spec.js
```

Include any new archive/shared/multi-admin E2E file in the focused command.

## Acceptance Criteria

- `main.js` is an understandable façade/store rather than the implementation site for all domains.
- Model, timer, synchronization/merge, and archive/collaboration responsibilities have explicit owners.
- Existing store consumers continue to work or are migrated with explicit tests.
- Runtime resources have deterministic lifecycle cleanup.
- The affected-area coverage table has no unexplained gaps.
- The same unit/integration/E2E matrix passes before and after every extraction stage.
- Lint and relevant tests pass.
