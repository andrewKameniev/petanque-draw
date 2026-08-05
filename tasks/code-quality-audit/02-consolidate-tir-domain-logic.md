# Task 2: Consolidate Tir Domain Logic and Split `TirModule`

## Goal

Make `src/services/tir.js` the single source of truth for tir scoring and playoff calculations, then split `TirModule.vue` along clear UI/workflow boundaries.

This is a behavior-preserving refactor. Existing scoring, tiebreaker, round-two, playoff, export, Firebase synchronization, and public-display behavior must remain intact.

## Problem

Tir logic was partially extracted into `src/services/tir.js`, but multiple components still implement local variants of the same rules.

Examples include:

- Score totals and carreau counts
- Throw counts and completion checks
- Atelier totals and completion checks
- Combined round totals
- Seeded playoff bracket generation
- Playoff round labels and match traversal
- Direct mutation of participant and match props

`TirModule.vue` is also approximately 2,600 lines and currently owns participant administration, lane changes, scoring navigation, tiebreakers, round transitions, playoff creation/progression, Firebase calls, and exports.

## Relevant Files

- `src/services/tir.js`
- `src/components/tir/TirModule.vue`
- `src/components/tir/TirPublicView.vue`
- `src/components/tir/TirParticipantView.vue`
- `src/components/tir/TirAtelierView.vue`
- `src/components/tir/TirPlayoffMatch.vue`
- `src/components/tir/TirPlayoffComparison.vue`
- `src/components/tir/TirParticipantsList.vue`
- `src/components/tir/TirProtocol.vue`
- `src/components/training/TrainingSession.vue`
- `src/stores/main.js`
- `tests/tir.test.js`
- Tir-related tests under `src/__tests__/`
- `docs/systems/tir.md`

## Required Changes

### 1. Inventory existing helpers before adding anything

Start by mapping every score/ranking/bracket helper in `src/services/tir.js` to its local equivalents in the components.

Reuse existing exports wherever their semantics match. Do not introduce a second helper with a slightly different name for the same rule.

At minimum, remove local reimplementations of:

- `getScoreTotal`
- `getScoreCarreauCount`
- `getCombinedTotal`
- `getThrowCount`
- `isParticipantComplete`
- `getAtelierScore`
- `isAtelierComplete`
- `generateSeededBracket`
- Match score/throw helpers already exposed by the service

### 2. Add missing pure domain operations

Where components currently mutate nested score structures directly, add pure service operations with explicit inputs and outputs. Candidate APIs include:

```js
toggleParticipantScore(participant, scoresKey, atelierIndex, distance, resultType);
fillMissingAtelierScores(participant, scoresKey, atelierIndex, distances);
updateTirMatchFromScores(match, totalThrows);
getTirPlayoffDisplayRounds(playoff, labels);
```

Names may differ, but the operations must be testable without mounting Vue components.

Prefer returning updated objects or documented domain results. Avoid hiding Firebase writes inside domain helpers.

### 3. Remove prop mutation from leaf components

Remove `vue/no-mutating-props` suppressions from tir components touched by this task.

Leaf scoring components should emit a precise event containing the intended score change or an updated copy. The owning component/store remains responsible for applying and synchronizing the change.

Do not break the existing granular Firebase actions such as:

- `syncTirParticipants`
- `syncTirState`
- `syncTirPlayoff`
- `syncTirPlayoffMatch`

### 4. Split `TirModule.vue`

Keep `TirModule.vue` as the orchestration shell, but extract cohesive parts. A reasonable target structure is:

- `TirScoringWorkspace.vue`: participant/atelier scoring-mode selection and navigation
- `TirRoundTable.vue`: two-round/tiebreaker table
- `TirPlayoffAdmin.vue`: playoff setup, round display, and match selection
- `src/services/tir-export.js`: export data, CSV generation, and download logic
- A composable or pure workflow module for tiebreaker and round-two transitions if those methods remain large

Exact filenames may be adjusted to fit the code, but avoid creating tiny one-use components that merely wrap a few lines of markup.

### 5. Consolidate public tir calculations

Update `TirPublicView.vue` and related read-only components to use the same service helpers as the admin flow.

Admin and public views must not use different ranking or completion rules.

### 6. Keep training semantics separate where necessary

`TrainingSession.vue` uses a different attempts data shape. Reuse shared scoring constants and reusable visual primitives, but do not force tournament tir data structures onto training sessions.

If generic score-toggle logic can support both shapes cleanly, document the abstraction. Otherwise, keep separate storage adapters while sharing scoring rules and UI styles.

## Compatibility Constraints

- Preserve `SCORING`, atelier keys, junior/full distances, and current ranking tie-break order.
- Preserve old tournament records with missing optional tir fields.
- Preserve multi-admin merge and granular Firebase synchronization behavior.
- Do not change Firebase field names or move data paths.
- Preserve current translations and public/protocol output.
- Do not combine this work with a visual redesign.

## Non-Goals

- Changing tir competition rules
- Changing playoff qualification counts
- Changing export formats
- Replacing Options API across the entire feature
- Migrating tournament data in Firebase
- General store decomposition from Task 4

## Affected Area and Required Regression Coverage

Before refactoring, build a coverage matrix for every affected workflow. Existing coverage is substantial, but it is uneven between pure rules and complete browser flows.

| Affected behavior                                 | Existing coverage to retain                                          | Required coverage audit/addition                                                                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoring constants, totals, counts, and completion | `tests/tir.test.js`                                                  | Confirm every local helper being removed has an equivalent service test, including malformed/missing atelier objects.                                                   |
| R1 ranking and score-type tie breakers            | `tests/tir.test.js`                                                  | Add any missing cases for the exact production tie-break order before replacing component-local sorts.                                                                  |
| R2 qualification and boundary ties                | `tests/tir.test.js`                                                  | Retain fewer-than-20, exact boundary, multi-way tie, and different-shot-composition cases.                                                                              |
| Seeded bracket creation and playoff progression   | `tests/tir.test.js`                                                  | Ensure all bracket sizes used by the UI and final/third-place creation are covered.                                                                                     |
| Playoff scoring progress                          | `tests/tir-playoff-progress.test.js`                                 | Retain player-1/player-2, junior/full distance, concurrent matches, and qualification-vs-playoff score separation.                                                      |
| Tir protocol/public integration                   | `src/__tests__/protocol-components.spec.js`, protocol suites         | Add focused assertions that admin/public/protocol use the same rank and totals after extraction.                                                                        |
| One-round admin scoring                           | `e2e/tir.spec.js`                                                    | Preserve participant list, progress, and table result scenarios.                                                                                                        |
| Two-round transition and playoff start            | `e2e/tir.spec.js`                                                    | Preserve existing R1 labels, R2 transition, and playoff start scenarios.                                                                                                |
| Tiebreaker lifecycle                              | Strong unit coverage exists; no complete E2E was identified          | Add an E2E flow that creates a boundary tie, completes EX scoring, and verifies the correct R2 participants.                                                            |
| Full playoff completion                           | E2E opens playoff comparison but does not clearly finish the bracket | Add an E2E flow through final/third place and tournament completion.                                                                                                    |
| Public view during scoring                        | No focused public tir E2E was identified                             | Add public-page assertions for live progress, R1/R2 table, and playoff results.                                                                                         |
| Multi-admin granular sync                         | Store/unit coverage is indirect                                      | Add a deterministic integration test for two edits on different participants/matches; add E2E only if the existing test environment safely supports two pages/contexts. |
| Prop ownership/events                             | Existing components suppress `vue/no-mutating-props`                 | Add component tests proving score-edit events do not mutate input props before removing suppressions.                                                                   |

### Baseline-before-refactor rule

Before implementation:

1. Run `tests/tir.test.js`, `tests/tir-playoff-progress.test.js`, tir-related component/protocol tests, and `e2e/tir.spec.js`.
2. Add the missing characterization tests from the table while the old implementation is still present.
3. Confirm all new characterization tests pass against the current behavior.
4. Record any intentionally unsupported scenario rather than silently omitting it.

After refactoring, run the identical focused unit/component/E2E matrix and compare results.

## Unit and Component Tests

Expand pure service tests to cover:

1. Score total, score-type counts, and throw counts
2. Participant and atelier completion
3. Score toggling and filling missing scores
4. R1, R2, combined, and tiebreaker ranking
5. Seeded brackets for supported sizes
6. Playoff match completion, tie winner, winner, and loser
7. Public and admin views producing consistent rankings
8. Leaf components emitting changes without mutating props
9. Existing Firebase sync actions still being invoked at the same workflow points

## E2E Tests

The final E2E matrix must cover:

1. One-round senior scoring from first score through result table
2. Junior scoring with three distances
3. Two-round R1 → R2 transition
4. Boundary tiebreaker/EX round → correct R2 qualifiers
5. R2 → playoff transition
6. Playoff match editing, advancement, final, third place, and finish
7. Public tir progress/results matching the admin state
8. Reload/resubscribe during an in-progress tir tournament without losing scores

Follow `e2e/README.md` and guarantee cleanup for every created tournament.

## Verification

Run:

```bash
npm run lint
npm run test:run
npm run test:protocol
npx playwright test e2e/tir.spec.js
```

## Acceptance Criteria

- `src/services/tir.js` or a clearly named adjacent tir service owns all shared scoring and playoff calculations.
- Duplicate local score/count/completion/bracket helpers are removed.
- Tir leaf components no longer suppress `vue/no-mutating-props` for score editing.
- `TirModule.vue` is reduced to an orchestration shell with cohesive child components/services.
- Admin, public, and protocol tir output use the same domain rules.
- Existing granular Firebase synchronization is preserved.
- The affected-area coverage table has no unexplained gaps.
- Focused tir E2E passes before and after the refactor, including tiebreaker and public display.
- Lint and relevant unit/component/E2E tests pass.
