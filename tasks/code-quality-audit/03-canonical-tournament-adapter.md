# Task 3: Introduce a Canonical Tournament Record Adapter

## Goal

Centralize all interpretation of new and legacy tournament record shapes so UI components no longer branch directly on `main`, `tournamentB`, or `groupB`.

This task must preserve the current Firebase schema. It introduces an application-side adapter, not a database migration.

## Problem

The application supports at least two persisted shapes:

1. New wrapper format with metadata plus `main` and optional `tournamentB`
2. Legacy root tournament format with optional `groupB`

Format detection, active-group selection, metadata lookup, and Firebase path construction are repeated across the store and views. Each copy handles a slightly different subset of fields.

Current examples include:

- `src/stores/main.js`: `isNewFormat`, `activeTournament`, and `_getTarget`
- `src/views/Public.vue`: `activeTournamentView`
- `src/views/TvDashboard.vue`: manual `data.main` unwrapping
- `src/views/Archived.vue`: `activeTournament`, date, portal ID, and update-prefix logic
- `src/components/Tournament.vue`: another active-group selection
- `src/components/Navbar.vue`: `t.main || t`

## Relevant Files

- `src/stores/main.js`
- `src/views/Public.vue`
- `src/views/TvDashboard.vue`
- `src/views/Archived.vue`
- `src/components/Tournament.vue`
- `src/components/Navbar.vue`
- `src/services/testUtils.js`
- `src/services/protocol-runtime.js`
- `src/protocol-helpers.js`
- `docs/data-model.md`
- `docs/systems/tournament-b.md`
- `src/__tests__/group-b-store.spec.js`
- `tests/archived-migration.test.js`
- Public-routing and tournament-B tests

## Required Changes

### 1. Create a pure adapter module

Create a module such as `src/services/tournament-record.js` or `src/domain/tournament-record.js`.

It should provide a small, documented API covering the repeated operations. Suggested functions:

```js
isTournamentEnvelope(record);
getTournamentMain(record);
getTournamentGroup(record, (group = 'A'));
getActiveTournamentGroup(record);
getTournamentMetadata(record, (fallback = {}));
getTournamentStorageTarget(record, (group = 'A'));
normalizeTournamentRecord(record, (options = {}));
```

The exact API may change after inspecting callers, but it must clearly distinguish:

- Wrapper metadata
- Competition data for group A
- Competition data for group B
- Firebase path prefix for the selected data

### 2. Define canonical fallback behavior

Document and test what happens when:

- `activeGroup` is missing
- Group B is selected but does not exist
- A legacy `groupB` contains only a subset of fields
- A new wrapper has metadata at the root and competition data under `main`
- Optional arrays/objects are absent
- An archived/shared record lacks a local `id`

Avoid constructing ad hoc partial tournament objects in views. The adapter should return a stable normalized view or clearly defined fallback.

### 3. Consolidate normalization

The store currently applies defaults separately when loading owned, shared, and unarchived tournaments.

Move that behavior into one pure `normalizeTournamentRecord` function and use it from:

- `setTournaments`
- `loadSharedTournament`
- `unarchiveTournament`
- Any other load boundary discovered during implementation

Normalization must not mutate the caller's source object unless the API explicitly documents that behavior. Prefer returning a new normalized record.

### 4. Migrate UI consumers

Replace direct format checks in Public, TV, Archived, Tournament, Navbar, and other production consumers with adapter calls.

After migration, production views should not contain manual expressions such as:

```js
record.main || record;
record.tournamentB || record.groupB;
record?.main ? 'main/' : '';
```

Small guards for absent records are fine; storage-format knowledge is not.

### 5. Preserve metadata correctly

Ensure the adapter exposes root metadata such as:

- Name
- ID
- Date
- Tournament message
- Portal tournament ID
- Collaborators/owner information when present

Do not copy root metadata into competition data merely to make one view work. Return metadata explicitly or expose a documented presentation object.

### 6. Update documentation

Update `docs/data-model.md` and, if needed, `docs/systems/tournament-b.md` with:

- Persisted shapes
- Canonical application adapter
- Group-selection behavior
- Clear statement that no Firebase migration is performed by this task

## Compatibility Constraints

- Do not rename, move, or rewrite Firebase tournament paths.
- Both new and legacy records must remain readable and writable.
- Preserve group A/B switching behavior.
- Preserve archived/shared tournament ownership paths.
- Preserve public links and route parameters.
- Preserve granular sync prefixes used by the store.
- Do not make Vue or Pinia APIs dependencies of the adapter; keep it pure.

## Non-Goals

- Removing legacy Firebase records
- Migrating all records to the wrapper format
- Consolidating public subscriptions from Task 5
- Decomposing the entire store from Task 4
- Redesigning tournament metadata UI

## Affected Area and Required Regression Coverage

This adapter sits underneath most application surfaces. Before replacing any caller, audit the following behavior against existing unit and E2E coverage and add characterization tests for every missing row.

| Affected behavior                               | Existing coverage to retain                                              | Required coverage audit/addition                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| New wrapper creation and active group selection | `src/__tests__/group-b-store.spec.js`                                    | Move assertions toward the adapter while retaining store integration coverage.                                       |
| Group-aware write prefixes                      | `src/__tests__/group-b-store.spec.js`                                    | Cover A/B prefixes for new and legacy records, including missing B fallback.                                         |
| Owned tournament loading/defaults               | `src/__tests__/tournament-url-routing.spec.js`, `tests/user-map.test.js` | Add canonical normalization assertions for missing arrays/preferences and input immutability.                        |
| Shared tournament loading/owner path            | `src/__tests__/tournament-url-routing.spec.js`, `tests/user-map.test.js` | Verify normalized shared records retain `_ownerUid`, metadata, and correct write target.                             |
| Archived and legacy saved migration             | `tests/archived-migration.test.js`                                       | Retain root, wrapper, missing-data, owner/admin, and legacy `saved/` migration scenarios.                            |
| Archive restore                                 | `tests/user-map.test.js`                                                 | Verify restored new and legacy records pass through the same normalizer.                                             |
| Public A/B selection                            | Group-B unit/E2E covers creation and switcher behavior                   | Add direct public-view assertions for both A and B competition data.                                                 |
| TV record selection                             | No focused new/legacy TV adapter coverage was identified                 | Add unit/integration coverage for wrapper and legacy records, including root tournament message.                     |
| Navbar/metadata display                         | `e2e/navbar.spec.js` covers layering, not record interpretation          | Add component tests for name/date/system from wrapper and legacy records.                                            |
| New-format Group B browser flow                 | `e2e/group-b.spec.js`, relevant Swiss/groups E2E                         | Retain full switch/create/play flows and assert correct data after reload.                                           |
| Legacy browser compatibility                    | No explicit legacy-record E2E was identified                             | Add a deterministic seeded legacy fixture, open it in admin/public/archive as applicable, and remove it in teardown. |

### Baseline-before-refactor rule

Before implementation:

1. Run all existing suites named in the table.
2. Add adapter characterization tests using representative real record shapes from existing fixtures/tests.
3. Add missing browser coverage, especially a seeded legacy record and new-format A/B switching.
4. Confirm these tests pass before migrating production callers.
5. Record the exact fixture shape and cleanup path so future agents can reproduce the baseline.

After implementation, run exactly the same focused unit/integration/E2E matrix.

## Unit and Integration Tests

Add table-driven tests for:

1. New-format group A selection and prefix
2. New-format group B selection and prefix
3. Missing new-format group B fallback
4. Legacy root selection and empty prefix
5. Legacy group B selection and prefix
6. Default preferences and absent arrays after normalization
7. Root metadata versus competition data
8. Owned, shared, archived, and unarchived load paths using the same normalization
9. No input-object mutation, if the adapter is specified as immutable

Keep or update existing group-B and archived-migration tests to assert behavior through the adapter.

## E2E Tests

The final browser matrix must cover:

1. Create a new-format tournament, reload it, and confirm group A remains selected and editable.
2. Create/switch to tournament B, reload, and confirm B data and writes remain isolated from A.
3. Open the same new-format record through Public and TV routes and verify name/system/teams/message.
4. Seed a legacy root-format tournament, open it, edit a safe field, reload, and confirm the legacy path is preserved.
5. Seed a legacy record with `groupB`, switch groups in the public/admin surface that supports it, and confirm both groups render correctly.
6. Archive and restore representative new and legacy records without changing their Firebase storage shape.
7. Open a shared tournament and confirm reads/writes still use the owner UID.

Do not rely only on source-string or mocked-unit assertions for legacy compatibility. Use a deterministic Firebase fixture in E2E and clean it up according to `e2e/README.md`.

## Verification

Run:

```bash
npm run lint
npm run test:run
npx playwright test e2e/group-b.spec.js e2e/archived-layout.spec.js
```

Include any new adapter/legacy E2E file in the focused command and document it in the task/PR summary.

## Acceptance Criteria

- One pure adapter module owns format detection, normalization, group selection, metadata access, and storage-prefix selection.
- Owned, shared, and archived load paths use the same normalizer.
- Production views no longer manually unwrap `main` or assemble legacy group-B objects.
- Firebase storage format and paths remain unchanged.
- New and legacy tournament tests pass.
- Data-model documentation describes the adapter and both persisted formats.
- The affected-area coverage table has no unexplained gaps.
- New-format, tournament-B, legacy, archive, shared, Public, and TV behavior is covered at the appropriate unit/integration/E2E level.
- The same focused suite passes before and after the refactor.
- Lint, unit/integration, and relevant E2E tests pass.
