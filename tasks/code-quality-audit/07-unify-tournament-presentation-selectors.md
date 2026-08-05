# Task 7: Unify Tournament Presentation Selectors

## Goal

Create one tested set of pure selectors for tournament status, phase, round, summary text, playoff metadata, and timer/extras presentation.

Use the selectors consistently in Public, Archived, TV, and other tournament summary surfaces while keeping view-specific markup separate.

## Problem

Public and Archived independently calculate:

- Active round
- Started/finished state
- Status badge class and label
- Swiss/system description
- Cadrage place range
- Playoff participant count
- Whether the tournament is in a playoff/final
- Time-limit and cochonette summary
- Tournament message lines

These copies have diverged. For example, Public uses the shared `formatSwissDescription`, Archived carries a local older version, and the two views use different guards for `cochonettesEnabled`.

TV contains another set of related phase, timer, and system-summary calculations.

## Dependencies

- Use the canonical record/group selection API from Task 3 if available.
- Coordinate with Task 6 for ranking-derived values and Task 5 for live data. This task owns presentation calculations, not data loading.

## Relevant Files

- `src/views/Public.vue`
- `src/views/Archived.vue`
- `src/views/TvDashboard.vue`
- `src/components/Tournament.vue`
- `src/helpers.js`
- `src/services/results.js`
- `src/services/playoff.js`
- `tests/swiss-description.test.js`
- `tests/pluralize-rounds.test.js`
- `src/__tests__/timer-ui.spec.js`
- `src/__tests__/double-elimination.spec.js`
- Public/archive/timer E2E coverage

## Required Changes

### 1. Define pure selector inputs

Create a module such as `src/services/tournament-presentation.js`.

Selectors must take tournament data plus explicit labels/locale/time where needed. They must not import a Vue component instance or call `this.$t` internally.

Candidate selectors:

```js
getActiveRound(tournament);
isTournamentStarted(tournament);
getTournamentPhase(tournament);
getTournamentStatus(tournament);
getTournamentSystemDescription(tournament, locale, labels);
getCadragePlaceRange(tournament);
getPlayoffParticipantCount(tournament);
isTournamentFinal(tournament);
getTournamentExtras(tournament, labels);
getVisibleRoundTimer(tournament);
splitTournamentMessage(message);
```

The exact API may differ, but do not expose one large function that returns an opaque bag of everything.

### 2. Extend, do not duplicate, existing helpers

`formatSwissDescription` and `pluralizeRounds` already have focused tests. Move or re-export them from the presentation module if appropriate, but keep one implementation and preserve imports during migration.

Use existing playoff helpers such as double-elimination participant count instead of copying their logic.

### 3. Define phase/status precedence

Document and test precedence when multiple fields exist:

- Finished
- Tir playoff/round
- Double-elimination active stages
- Standard/team playoff
- Cadrage
- Active Swiss/group round
- Configured but not started

Do the same for final detection and timer limits.

### 4. Migrate each view

Replace duplicated computed properties in Public and Archived first, then migrate matching TV calculations where semantics are shared.

Keep localized label selection in the view or pass a label object to pure selectors.

### 5. Resolve known divergence explicitly

For the cochonette summary, use the actual enabled flag and count consistently. Add a test that proves disabled cochonettes are not displayed even when the stored default count is nonzero.

If another existing difference is intentional, document it as a separate selector option rather than maintaining copied logic.

## Affected Area and Required Regression Coverage

| Affected behavior                   | Existing coverage to retain                                         | Required coverage audit/addition                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Swiss description and pluralization | `tests/swiss-description.test.js`, `tests/pluralize-rounds.test.js` | Retain all locale/round/barrage/playoff combinations while moving/re-exporting helpers.                                                |
| Active round                        | Indirectly exercised throughout tests                               | Add direct cases for no games, active round, completed round, cadrage/playoff, and tir.                                                |
| Started/finished state              | Public and Archived have different logic                            | Characterize both with empty, configured, partially scored, active, and finished tournaments; choose/document canonical semantics.     |
| Phase/status badge                  | No focused shared selector suite was identified                     | Add cases for Swiss, group, cadrage, playoff, double elimination, tir R1/R2/playoff/final, and finished.                               |
| Cadrage range                       | Indirect UI use                                                     | Add zero/one/multiple match cases with and without an existing playoff list.                                                           |
| Playoff participant count           | `src/__tests__/double-elimination.spec.js` covers bracket behavior  | Add selector cases for standard, team, and double elimination.                                                                         |
| Final detection                     | Timer/store logic uses multiple signals                             | Add standard, bracket stage, double-elimination grand final, and false-positive cases.                                                 |
| Timer/extras line                   | `src/__tests__/timer-ui.spec.js`                                    | Add enabled/disabled cochonettes, playoff limit, no-limit final, paused/running/ended, and missing preference cases.                   |
| Public versus Archived summary      | No direct parity suite was identified                               | Add integration tests that feed the same tournament to both consumers and assert identical shared values.                              |
| Browser-visible metadata            | Existing E2E is sparse for Public/Archived summaries                | Add E2E assertions for status, system text, timer/extras, cadrage/playoff count, and message in both active public and archived views. |

### Baseline-before-refactor rule

Before replacing computed properties:

1. Build representative tournament fixtures for every phase/system.
2. Execute current Public, Archived, and TV calculations against them.
3. Record differences and mark each as intentional or a bug.
4. Add characterization tests for intended behavior and separately document approved corrections.
5. Add browser assertions for key visible summary fields before migrating views.

Run the same fixtures and E2E assertions after each consumer is migrated.

## Unit and Integration Tests

Cover:

1. All supported systems and phases
2. Missing legacy fields/defaults
3. Standard/team/double-elimination playoffs
4. Tir rounds and playoff
5. Timer/cochonette combinations
6. Locale/pluralization behavior
7. Public/Archived parity
8. TV-specific options where the shared selector accepts them
9. Pure, input-immutable behavior

## E2E Tests

Add or extend coverage for:

1. Not-started Public tournament summary
2. Active round with timer and cochonettes
3. Cadrage summary
4. Standard and double-elimination playoff summary
5. Finished status
6. Tir R1/R2/playoff phase labels
7. Archived tournament showing the same system/limits metadata as its active public version
8. Tournament message line rendering

Use deterministic fixtures and follow `e2e/README.md` cleanup requirements.

## Compatibility Constraints

- Preserve localization keys and supported locales.
- Preserve current data and Firebase shape.
- Do not make selectors depend on Vue, Pinia, router, or Firebase.
- Do not move view-specific layout into the selector module.
- Treat intentional behavior fixes separately in tests/notes.

## Non-Goals

- Public/Archived visual redesign
- Ranking consolidation from Task 6
- Live subscription work from Task 5
- Tournament-rule changes

## Verification

Run:

```bash
npm run lint
npm run test:run
npx playwright test e2e/tournament-presentation.spec.js e2e/archived-layout.spec.js
```

The exact new E2E filename may differ; document the focused suite.

## Acceptance Criteria

- One pure presentation module owns shared tournament status/summary calculations.
- Public and Archived no longer carry independent copies of those rules.
- TV uses the shared selectors wherever semantics match.
- Disabled cochonettes cannot appear from a nonzero default count.
- Intentional per-view differences are explicit options, not copied implementations.
- The affected-area coverage table has no unexplained gaps.
- The same fixture and E2E matrix passes before and after migration.
- Lint and relevant tests pass.
