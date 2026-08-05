# Task 6: Consolidate Group Statistics and Ranking Calculations

## Goal

Create one pure, reusable pipeline for accumulating group game statistics and applying the correct ranking policy for round-robin groups, poules, Swiss groups, and barrage.

Remove duplicated calculation loops from components and ensure admin, public, archive, results, and protocol surfaces use the same results.

## Problem

Similar wins/points accumulation exists in:

- `src/helpers.js`
- `src/services/results.js`
- `src/components/partials/Ranking.vue`
- `src/components/partials/TeamsList.vue`

The copies differ in:

- Whether unfinished games are ignored
- Numeric conversion of score fields
- Filtering by group index
- Whether original team/group objects are mutated
- Whether regulation tie-break rules are applied
- How barrage games are sliced

This can make the same tournament rank differently depending on which screen renders it.

## Relevant Files

- `src/helpers.js`
- `src/services/results.js`
- `src/components/partials/Ranking.vue`
- `src/components/partials/TeamsList.vue`
- `src/components/partials/Results.vue`
- `src/services/draw.js`
- `tests/ranking.test.js`
- `tests/results-tab-selection.test.js`
- `tests/poules.test.js`
- `tests/draw.test.js`
- `tests/reshuffle-groups.test.js`
- `e2e/groups.spec.js`
- `e2e/swiss.spec.js`
- Ranking/system documentation

## Required Changes

### 1. Define a pure statistics accumulator

Create or export a function with explicit options, for example:

```js
computeGroupStats({
  teams,
  rounds,
  groupIndex,
  includeStatuses,
});
```

It should:

- Return new team/stat objects
- Never mutate tournament groups or teams
- Convert persisted string scores safely to numbers
- Ignore missing/null scores
- Apply an explicit game-status policy
- Ignore games whose teams are outside the target group
- Support filtering by group index without duplicating the loop

### 2. Separate accumulation from ranking policy

Keep these concerns distinct:

- Accumulating wins/points/games played
- Regulation round-robin tie breaking (`rankGroupByRegulations`)
- Simple wins/point-difference ranking where that is the actual barrage/poules rule
- Swiss group ranking using Swiss metrics

Expose clearly named policy functions rather than boolean combinations whose meaning is unclear.

### 3. Provide tournament-level selectors

Create reusable selectors for:

- Round-robin group rankings
- Poules rankings
- Swiss-group rankings
- Barrage rankings from `barrage.startIndex`

Update `getTeamsRanking` to delegate to these selectors.

### 4. Remove component-local calculations

Replace:

- `Ranking.vue` local `barrageRankingTeams` calculation
- `TeamsList.vue` local group-stat accumulation
- `results.js` duplicated poules accumulation
- Private duplicated accumulation in `helpers.js`

Components should receive or call selectors; they should not implement tournament rules.

### 5. Document status and tie-break policies

Update relevant docs to state:

- Which statuses count in live versus completed ranking
- Score conversion behavior
- Tie-break order per system
- Whether active-round partial scores appear in rankings

## Affected Area and Required Regression Coverage

| Affected behavior                     | Existing coverage to retain                          | Required coverage audit/addition                                                                                                     |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Regulation ranking and recursive ties | `tests/ranking.test.js`                              | Retain all two-team, multi-team, recursive, status, and multi-circle cases.                                                          |
| `getTeamsRanking` group integration   | `tests/ranking.test.js`                              | Add cases proving no input mutation and string-score conversion.                                                                     |
| Poules qualification/draw             | `tests/poules.test.js`                               | Keep qualification rules separate from display ranking and verify shared stats do not alter draw behavior.                           |
| Poules display ranking                | `tests/results-tab-selection.test.js`                | Retain multiple groups/null scores and add status/string-score cases.                                                                |
| Barrage ranking                       | Partial local logic lacks a dedicated complete suite | Add unit fixtures for start index, group filtering, null/in-progress games, ties, and multiple groups.                               |
| Swiss groups                          | Draw and E2E coverage exists                         | Add selector tests proving opponents/Swiss metrics remain group-local and inputs remain unchanged.                                   |
| Multi-circle cumulative ranking       | `tests/ranking.test.js`, `e2e/groups.spec.js`        | Preserve cumulative results across two/three circles.                                                                                |
| Ranking shown in different surfaces   | Components currently calculate independently         | Add integration tests asserting Ranking, TeamsList, Public/Archived consumers receive the same ordered titles/stats for one fixture. |
| Full round-robin browser flow         | `e2e/groups.spec.js`                                 | Retain even, odd/bye, multiple groups, and cumulative ranking scenarios.                                                             |
| Swiss groups browser flow             | `e2e/groups.spec.js`                                 | Retain seeded/snake/balanced and playoff qualification scenarios.                                                                    |
| Poules/barrage browser flow           | No focused complete E2E was identified               | Add an E2E that enters known scores and asserts exact standings/qualifiers before and after barrage.                                 |

### Baseline-before-refactor rule

Before changing calculations:

1. Create shared fixtures representing round-robin, Swiss groups, poules, and barrage.
2. Run those fixtures through every current calculation path and record any differences.
3. Decide which result matches documented rules; encode it in characterization tests before removing copies.
4. Add missing barrage/poules E2E coverage with deterministic scores.
5. Confirm the complete focused matrix passes before replacement.

Do not silently “fix” an observed difference during a reuse refactor. If behavior must change, document it separately and update expectations explicitly.

## Unit and Integration Tests

Cover at minimum:

1. Empty/missing data
2. Numeric and string scores
3. Null, not-started, in-progress, and finished games
4. Games outside the selected group
5. Multiple groups
6. Even and odd/bye schedules
7. Regulation head-to-head ties
8. Multi-circle aggregation
9. Barrage start-index slicing
10. Swiss-group isolation
11. Input immutability
12. Consistent results across all consuming surfaces

## E2E Tests

The final focused E2E matrix must include:

1. Standard round-robin with exact final order
2. Odd group with technical bye
3. Multi-circle cumulative ranking
4. Multiple independent groups
5. Swiss groups with known playoff qualifiers
6. Poules through qualification
7. Barrage with known final order/qualifiers
8. Public/archive ranking matching the admin ranking for the same completed tournament

Follow `e2e/README.md` and clean up fixtures.

## Compatibility Constraints

- Preserve documented tournament rules.
- Preserve live-ranking behavior unless a separately documented bug is approved.
- Preserve existing data structures returned to components where practical.
- Do not mutate input tournament/team/group objects.
- Do not change draw/schedule generation as part of this task.

## Non-Goals

- Rewriting Swiss pairing
- Changing official tie-break regulations
- Redesigning ranking tables
- Changing playoff qualification settings

## Verification

Run:

```bash
npm run lint
npm run test:run
npx playwright test e2e/groups.spec.js e2e/swiss.spec.js e2e/poules-barrage.spec.js
```

The exact new E2E filename may differ; include the deterministic poules/barrage coverage in the focused command.

## Acceptance Criteria

- One pure accumulation pipeline is used by all group-ranking variants.
- Ranking policies are explicit and separately tested.
- Components no longer implement wins/points accumulation.
- Admin, public, archive, results, and teams views agree for the same fixture.
- Input data is not mutated during ranking.
- The affected-area coverage table has no unexplained gaps.
- The same deterministic unit/integration/E2E matrix passes before and after the refactor.
- Lint and relevant tests pass.
