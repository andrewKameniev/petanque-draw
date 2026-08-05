# Task 5: Unify Public/TV Tournament Loading, References, and Live Subscriptions

## Goal

Create one tested infrastructure layer for decoding public tournament references, loading public tournament records, subscribing to live fields, resuming after visibility/network changes, and cleaning up listeners.

Use it from both `Public.vue` and `TvDashboard.vue` while allowing each view to select the data fields it needs.

## Problem

`Public.vue` and `TvDashboard.vue` independently implement:

- Public reference decoding
- Initial Firebase load
- New/legacy record handling
- Lists of subscribed fields
- Listener registration and cleanup
- Tournament-message subscription
- Error/loading behavior

The copies have already diverged: Public supports tournament B and tir fields, while TV has a smaller field list and unwraps `main` differently. Adding a new live field requires remembering every implementation.

`Public.vue` also checks `this.$route.query`, which is normally always an object, leaving its portal fallback effectively unreachable.

## Dependencies

- Prefer completing Task 3 first and use its tournament adapter.
- Reuse Task 4 synchronization infrastructure if it already provides safe read-only public subscriptions.

## Relevant Files

- `src/views/Public.vue`
- `src/views/TvDashboard.vue`
- `src/main.js`
- `src/components/partials/QrCode.vue`
- `src/views/Archived.vue`
- `src/views/CustomRoutes.vue`
- `src/services/db.js`
- Tournament adapter from Task 3
- `src/__tests__/tournament-url-routing.spec.js`
- `src/__tests__/timer-ui.spec.js`
- Public, group-B, tir, and TV-related tests

## Required Changes

### 1. Extract a reference codec

Create pure functions for public references, for example:

```js
encodeTournamentRef(ownerUid, tournamentId);
decodeTournamentRef(refValue);
```

Support both currently accepted formats:

- `ownerUid.base36TournamentId`
- Legacy base64 `ownerUid:tournamentId`

Return an explicit invalid result or throw a documented typed error for malformed references. Do not let `atob`, `parseInt`, or missing segments fail unpredictably in views.

Migrate every encoder/decoder found in Public, TV, QR code, Archived links, CustomRoutes, and router redirects.

### 2. Create a read-only live tournament source

Create a composable/service such as `useLiveTournament` or `createTournamentSubscription` that handles:

- Initial `getOne`
- Record adaptation through Task 3
- Subscription registration
- Subscription profiles/field sets
- Root metadata fields versus competition fields
- Tournament A/B where requested
- Unsubscribe/cleanup
- Visibility resume and online reconnect
- Loading, missing, and error states

Do not couple the core subscription service to a specific Vue view. If a composable wraps it, keep the lower subscription builder testable with mocked `tournamentService`.

### 3. Define subscription profiles

Centralize field lists with explicit profiles, for example:

- `PUBLIC_FIELDS`: teams, games, timer, playoffs, tir, streams, groups, system, status
- `TV_FIELDS`: teams, games, timer, playoffs, groups, system, status, schedule
- `WRAPPER_FIELDS`: message, active group, tournament B metadata

Profiles may share a base list. Add a test that prevents accidental duplicate/missing critical fields.

### 4. Migrate Public and TV

Remove local `_subscribeDynamic`, `_unsubscribeAll`, and duplicated initial-load code where the shared source replaces them.

Keep view-specific transformation and presentation in the views. The shared layer should supply data/state, not TV bracket layout or Public tabs.

### 5. Fix source selection explicitly

Replace the always-truthy `this.$route.query` branch with an explicit source decision:

- Valid Firebase reference/query
- Supported portal route/ID
- Invalid/missing reference

Cover every branch with tests.

## Affected Area and Required Regression Coverage

| Affected behavior                    | Existing coverage to retain                                    | Required coverage audit/addition                                                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?t=` internal tournament routing    | `src/__tests__/tournament-url-routing.spec.js`                 | Keep separate from public ref codec; ensure no regression from shared helper names.                                                                                        |
| Dotted and legacy base64 public refs | No dedicated codec suite was identified                        | Add pure round-trip, malformed, empty, Unicode/invalid base64, and nonnumeric ID tests.                                                                                    |
| Initial Public load                  | Indirect coverage only                                         | Add service/component tests for found, missing, error, new wrapper, and legacy records.                                                                                    |
| Initial TV load                      | Indirect coverage only                                         | Add the same record-shape/error cases for the TV profile.                                                                                                                  |
| Live field updates                   | Timer has structural tests; subscriptions lack a focused suite | Mock `subscribePath` and assert profile paths, applied snapshots, null values, and cleanup.                                                                                |
| Tournament message                   | Public/TV handle it differently                                | Add tests for initial and live root message in wrapper and legacy records.                                                                                                 |
| Tournament B live updates            | `e2e/group-b.spec.js` covers admin B flow                      | Add public subscription unit/E2E assertions for B creation, field updates, and switching.                                                                                  |
| Tir live updates                     | `e2e/tir.spec.js` covers admin flow                            | Add public subscription assertions for participants, round, playoff, and finish fields.                                                                                    |
| Visibility resume/online reconnect   | No focused tests identified                                    | Use fake events/timers to prove old listeners close before reload and only one listener set remains.                                                                       |
| Unmount cleanup                      | Existing methods are untested directly                         | Add deterministic unsubscribe-count tests for Public and TV.                                                                                                               |
| Admin → Public/TV realtime behavior  | No dedicated cross-page E2E was identified                     | Add two-page Playwright scenarios verifying score/timer/status updates without reload.                                                                                     |
| Portal fallback                      | Current branch appears unreachable                             | Add unit/E2E coverage for valid portal source and invalid source behavior, or remove the branch explicitly if the route is no longer supported and document that decision. |

### Baseline-before-refactor rule

Before implementation:

1. Add characterization tests for current Public/TV field lists and cleanup behavior.
2. Add the public-reference codec tests using current accepted links.
3. Add a two-page realtime E2E baseline for at least score and timer updates.
4. Confirm all characterization tests pass before switching either view.
5. Migrate one consumer at a time and rerun the matrix after each migration.

## Unit and Integration Tests

Cover:

1. Reference encode/decode and invalid values
2. Initial load states
3. New/legacy adaptation
4. Public and TV field profiles
5. Root, main, and tournament-B path construction
6. Snapshot application, including `null`
7. Errors and missing records
8. Visibility/online resume without duplicate listeners
9. Idempotent unsubscribe
10. Portal-vs-Firebase source decision

## E2E Tests

Use separate Playwright pages or contexts for admin and display surfaces:

1. Admin score update appears in Public without reload.
2. Admin timer start/pause/end appears in both Public and TV.
3. Tournament message update appears in Public and TV.
4. Group B creation/update appears after switching Public to B.
5. Tir score/playoff update appears in Public.
6. Reload, offline/online, or visibility resume does not duplicate or lose updates.
7. Both dotted and legacy public links open the expected tournament.

Follow `e2e/README.md` and clean up every fixture.

## Compatibility Constraints

- Preserve both public reference formats.
- Preserve public and TV routes.
- Preserve Firebase paths and read-only behavior.
- Preserve tournament B and legacy record support.
- Do not add write privileges to public/TV code.
- Do not merge TV-specific presentation into Public.

## Non-Goals

- TV visual redesign
- Public tab redesign
- Admin synchronization/store decomposition beyond necessary shared infrastructure
- Firebase schema migration

## Verification

Run:

```bash
npm run lint
npm run test:run
npx playwright test e2e/public-live.spec.js
```

The exact E2E filename may differ; document and run the focused Public/TV realtime suite.

## Acceptance Criteria

- One reference codec is used by all public-link producers/consumers.
- Public and TV share one tested loading/subscription infrastructure.
- Field profiles are centralized and explicit.
- Listener resume and cleanup are deterministic.
- Firebase and portal source selection is explicit and covered.
- The affected-area coverage table has no unexplained gaps.
- The same unit/integration/realtime E2E matrix passes before and after migration.
- Lint and relevant tests pass.
