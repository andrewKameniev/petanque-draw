# Task 1: Extract and Reuse `PublicGameCard`

## Goal

Create one canonical component for rendering a read-only public match card and use it for cadrage, grouped-round, and regular-round matches.

The final result must remove the repeated public match-card markup from `Public.vue` without changing the current appearance or behavior.

## Problem

The public match card currently has four implementations:

- `src/views/Public.vue` renders separate cards for cadrage matches, grouped matches, and regular matches.
- `src/components/partials/Game.vue` contains another implementation behind its `publicView` prop.

These implementations already differ in:

- Team-name formatting
- Winner detection (`winner` versus score comparison)
- Stream badge ordering and labels
- Score-history visibility
- Highlighting behavior
- Lane resolution

Maintaining these copies independently will continue to produce UI and behavior drift.

## Relevant Files

- `src/views/Public.vue`
- `src/components/partials/Game.vue`
- `src/assets/css/public-game-card.css`
- `src/services/streams.js`
- `src/services/lanes.js`
- `src/__tests__/playoff-ui-consistency.spec.js`
- Any tests that assert `public-game-card` markup or behavior

## Required Changes

### 1. Create `PublicGameCard.vue`

Create `src/components/partials/PublicGameCard.vue` as the only owner of read-only public match-card markup.

It should support, at minimum:

- The game object
- The resolved lane number
- Optional highlighted team or club
- Optional team-to-club map
- Optional stream URLs, or enough tournament/index context to resolve them consistently
- Whether score history is enabled
- Optional team-name formatter if the existing compact public formatting must be preserved

Prefer a small, explicit typed `props` object instead of the current array-style prop declaration.

### 2. Define one behavior for every match state

The component must render consistently for:

- Not started/upcoming
- In progress
- Finished
- Stream available before a match starts
- Stream available during a match
- Finished match with a winner
- Score history enabled/disabled
- Highlight by exact team name
- Highlight by club name

Winner detection must have a documented fallback. Prefer the persisted `game.winner` when valid, with numeric score comparison as the compatibility fallback.

### 3. Replace all three copies in `Public.vue`

Use `PublicGameCard` for:

- `activeTournamentView.cadrage`
- Every group in `groupedCurrentGames`
- `activeTournamentView.games[activeRound - 1]`

Keep grouping headers and list layout in `Public.vue`; move only the individual card responsibility into the new component.

### 4. Simplify `Game.vue`

Remove the public-only template and public-only computed/method logic from `Game.vue`, or delegate its public branch directly to `PublicGameCard` if another caller still relies on `publicView`.

The preferred end state is:

- `Game.vue`: editable/admin score row
- `PublicGameCard.vue`: read-only/public card

Before removing the `publicView` API, search the full repository and update all callers.

### 5. Keep shared styling centralized

Continue using `src/assets/css/public-game-card.css` as the shared visual source. Do not copy these styles into the new component as scoped CSS.

Delete obsolete duplicated public-card CSS only after verifying no other view relies on it.

## Compatibility Constraints

- Do not change the public route or Firebase data shape.
- Do not change how lanes or streams are stored.
- Preserve tournament-B and legacy tournament support.
- Preserve current localization keys.
- Do not introduce Pinia/Firebase write dependencies into `PublicGameCard`.
- The component must remain read-only and deterministic from its props.

## Non-Goals

- Redesigning the match card
- Changing admin score-entry behavior
- Changing stream preset storage
- Refactoring the full `Public.vue` view
- Rewriting lane-assignment logic

## Affected Area and Required Regression Coverage

Treat the following as the behavioral contract for this refactor. Before changing production code, map each row to an existing test and add a characterization test for every uncovered row.

| Affected behavior                                   | Existing coverage to retain                                                      | Required coverage audit/addition                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Public-card component/style reuse                   | `src/__tests__/playoff-ui-consistency.spec.js`                                   | Replace source-string assertions that require three copies with assertions that require one shared component.                        |
| Upcoming, active, and finished visual states        | Partial structural coverage in `playoff-ui-consistency.spec.js`                  | Add mounted component tests that assert classes and visible status text from representative game props.                              |
| Winner selection and styling                        | Partial public-card structural coverage                                          | Cover persisted `winner`, numeric-score fallback, missing scores, and string-valued scores.                                          |
| Team and club highlighting                          | `playoff-ui-consistency.spec.js` covers partial highlighting behavior            | Retain partial-match behavior and add exact team, club, absent map, and case-handling cases.                                         |
| Stream links/icons/labels                           | Stream helpers have indirect coverage                                            | Mount the card with YouTube/Twitch/Facebook/Instagram/unknown URLs and assert safe links, icon selection, and live/stream labels.    |
| Lane display in regular, grouped, and cadrage games | Lane logic is covered elsewhere; public rendering is not comprehensively covered | Add integration/component cases for explicit resolved lanes and each Public list context.                                            |
| Score-history chips and feature flag                | `tests/score-history.test.js` covers history generation                          | Add rendering tests for enabled, disabled, empty, and populated history. Do not duplicate the history-generation unit suite.         |
| Full public page after an admin update              | No dedicated public match-card E2E was found                                     | Add Playwright coverage that opens a public link and verifies an upcoming match becomes active/finished with scores and lane intact. |
| Grouped and cadrage public layouts                  | Swiss/groups E2E covers tournament workflows but not the public card itself      | Extend or add E2E scenarios for one grouped round and one cadrage match in the public view.                                          |

### Baseline-before-refactor rule

Before implementation:

1. Run the focused existing unit suites listed above.
2. Add missing characterization tests against the current behavior.
3. Run those new tests and confirm they pass before moving markup.
4. Record the focused unit and E2E commands in the task/PR summary.

After implementation, run exactly the same focused matrix again so before/after behavior can be compared.

## Unit and Component Tests

Add or update focused tests covering:

1. Upcoming, in-progress, and finished classes
2. Winner styling
3. Lane display
4. Team and club highlighting
5. Stream links and platform icons
6. Score-history rendering
7. Cadrage, grouped, and regular public lists all using `PublicGameCard`
8. No duplicate `class="match-item public-game-card"` implementation remains in `Public.vue`

Update existing structural tests so they verify shared component reuse rather than expecting three copied template blocks.

## E2E Tests

Add or extend Playwright coverage for these user-visible paths:

1. Regular Swiss round: public page shows lane, teams, upcoming state, then live/finished score after admin entry.
2. Group round: public page keeps group headings and renders every game through the shared card.
3. Cadrage: public page renders the cadrage match with correct winner and lane.
4. Stream and score history: at least one public match shows the configured stream link and history chips.
5. Team/club search highlighting still affects the matching public cards.

Follow `e2e/README.md`, use existing helpers where possible, and ensure every created tournament is deleted even if the assertion fails.

## Verification

Run:

```bash
npm run lint
npm run test:run
npx playwright test e2e/public-match-card.spec.js
```

The exact Playwright filename may differ if the coverage is added to existing suites; document and run the focused command that contains these scenarios.

## Acceptance Criteria

- A single `PublicGameCard.vue` owns public match-card rendering.
- `Public.vue` contains no duplicated individual match-card markup.
- `Game.vue` no longer owns a separate public-card implementation, unless it is a thin delegation wrapper for backward compatibility.
- Existing visual states, streams, score history, lanes, and highlighting continue to work.
- Relevant unit tests cover the canonical component.
- The affected-area coverage table has no unexplained gaps.
- Focused public-view E2E coverage passes before and after the refactor.
- Lint, unit tests, and relevant E2E tests pass.
