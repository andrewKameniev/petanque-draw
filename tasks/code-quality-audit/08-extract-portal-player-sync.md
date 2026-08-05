# Task 8: Extract and Generalize Portal Player Synchronization

## Goal

Move portal fetching, player identity matching, configurable field updates, and update statistics into one reusable service.

Use it from protocol refresh, tir protocol refresh, and archived logo/avatar refresh without duplicating matching rules or network handling.

## Problem

The codebase already has useful portal infrastructure:

- `fetchPortalTournamentTeams` in `src/services/protocol-runtime.js`
- Player matching and protocol field refresh in `src/protocol-helpers.js`

However, `Archived.vue` contains another complete workflow for:

- Fetching portal JSON
- Flattening portal players
- Normalizing names
- Disambiguating duplicates
- Updating club logos, avatars, club IDs, and club names
- Persisting teams/tir participants

This view-level copy uses different identity rules and silently swallows failures.

## Relevant Files

- `src/views/Archived.vue`
- `src/services/protocol-runtime.js`
- `src/protocol-helpers.js`
- `src/components/partials/Protocol.vue`
- `src/components/tir/TirProtocol.vue`
- `src/services/db.js`
- `src/__tests__/protocol-helpers.spec.js`
- `src/__tests__/protocol-runtime.spec.js`
- `src/__tests__/protocol-components.spec.js`
- `src/__tests__/portal-import.spec.js`
- Archive/protocol E2E coverage

## Required Changes

### 1. Create a portal API service

Move portal-specific HTTP behavior into a general module such as `src/services/portal.js`.

It should own:

- URL construction and ID encoding
- `format=json`
- Cache-busting/no-store behavior where required
- Response status handling
- Response-shape validation
- Normalized error objects/messages

Keep compatibility exports temporarily if existing imports use `protocol-runtime.js`.

### 2. Create one player identity index/matcher

Generalize the tested ID/name/club matching logic from `protocol-helpers.js`.

The matcher must prefer:

1. Stable portal player/team ID when available
2. Unique normalized surname/name identity
3. Club ID/name disambiguation when duplicate names exist
4. No match when ambiguity remains

Do not guess between ambiguous players.

Support both standard teams and tir participants through explicit adapters rather than unrelated copies.

### 3. Make synchronized fields configurable

Create a generic operation that accepts an allowlist/mapping of fields. Required use cases include:

- Protocol identity: second name, surname, name, club ID, sport title
- Tir protocol identity: protocol name, portal team ID, club ID, sport title
- Archive media: club logo URL, avatar URL, club ID, club name

Do not let one consumer erase required names or existing values when the portal omits an optional field.

### 4. Return structured results

Return statistics such as:

```js
{
  total,
  matched,
  changedPlayers,
  changedFields,
  missing,
  ambiguous,
}
```

Return updated copies or documented patches. Avoid forcing views to call `$forceUpdate` after deep mutation.

### 5. Simplify consumers

- Protocol and tir protocol should call the generalized service through small adapters.
- `Archived.vue` should request the media field set, persist returned teams/participants, and display/report errors consistently.
- Remove network and identity matching code from `Archived.vue`.

### 6. Preserve deterministic persistence

Only write Firebase paths whose data changed. Preserve owner UID and `main/` prefix behavior through the canonical tournament adapter.

Do not silently ignore portal or Firebase failures. Use the existing message/error pattern while avoiding disclosure of private response data.

## Affected Area and Required Regression Coverage

| Affected behavior                     | Existing coverage to retain                                           | Required coverage audit/addition                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Portal request URL/cache/status/shape | `src/__tests__/protocol-components.spec.js` indirectly covers refresh | Add direct portal-service tests for encoded IDs, cache busting, non-OK status, invalid JSON shape, and network failure.                |
| Numeric/string ID matching            | `src/__tests__/protocol-helpers.spec.js`                              | Retain stable-ID priority.                                                                                                             |
| Unique legacy name matching           | `src/__tests__/protocol-helpers.spec.js`                              | Retain surname/name normalization and old records without IDs.                                                                         |
| Duplicate-name disambiguation         | `src/__tests__/protocol-helpers.spec.js`                              | Retain club-based match and refusal to guess. Add club-name fallback if intentionally supported.                                       |
| Missing portal fields                 | `src/__tests__/protocol-helpers.spec.js`                              | Retain no-erasure behavior and add configurable optional media fields.                                                                 |
| Standard protocol refresh UI          | `src/__tests__/protocol-components.spec.js`                           | Retain busy guard, save-on-change, success/error messages, and state reset.                                                            |
| Tir protocol refresh                  | Protocol helper/component suites                                      | Retain participant identity mapping and ambiguous-name behavior.                                                                       |
| Archived logo/avatar refresh          | No focused service/component coverage was identified                  | Add tests for teams, tir participants, unchanged records, exact Firebase paths, owner UID, wrapper prefix, and visible error behavior. |
| Portal tournament import              | `src/__tests__/portal-import.spec.js`                                 | Ensure generalized portal code does not alter the separate team-import contract.                                                       |
| Browser refresh workflows             | No deterministic portal-refresh E2E was identified                    | Add Playwright route interception with fixture JSON for protocol and archived media refresh. Do not depend on the live portal in CI.   |

### Baseline-before-refactor rule

Before moving code:

1. Run all protocol helper/runtime/component and portal-import suites.
2. Add characterization tests for the current Archived media update behavior.
3. Add deterministic intercepted-network E2E for at least protocol refresh and archived logo/avatar refresh.
4. Confirm all new tests pass against the current implementation.
5. Migrate one consumer at a time and rerun the same matrix.

## Unit and Integration Tests

Cover:

1. Portal HTTP success/failure/validation
2. ID/name/club matching precedence
3. Ambiguity and missing players
4. Configurable field allowlists/mappings
5. Missing optional fields without destructive erasure
6. Standard and tir participant adapters
7. Structured change statistics
8. Input immutability or clearly documented patch semantics
9. Exact persistence paths for owned/shared and new/legacy records
10. Busy/error/message behavior in all consumers

## E2E Tests

Using Playwright request interception and local fixture responses, cover:

1. Standard protocol refresh updates identity fields and persists editable protocol state.
2. Tir protocol refresh updates the intended participant.
3. Archived standard tournament refresh updates club logo/avatar and re-renders.
4. Archived tir tournament refresh updates participant media.
5. Duplicate portal names do not update an ambiguous local player.
6. Portal error leaves local data unchanged and exposes the expected error state.

Follow `e2e/README.md` and clean up any seeded tournament. Never make CI depend on current live portal data.

## Compatibility Constraints

- Preserve portal endpoint contract.
- Preserve current identity safety: never guess ambiguous players.
- Preserve existing protocol refresh behavior and messages where possible.
- Preserve Firebase owner/group prefixes.
- Do not erase required identity fields because the portal omitted them.
- Do not log full participant data in errors.

## Non-Goals

- Redesigning protocol/archive UI
- Changing portal API
- Bulk syncing every portal field
- Reworking general tournament import
- Live-portal E2E dependency

## Verification

Run:

```bash
npm run lint
npm run test:protocol
npm run test:run
npx playwright test e2e/portal-player-sync.spec.js
```

## Acceptance Criteria

- One portal API service owns fetch/validation behavior.
- One tested matcher owns player identity resolution.
- Consumers select explicit field sets through adapters.
- `Archived.vue` no longer contains portal fetch/matching loops.
- Ambiguous matches remain untouched and errors are no longer silently swallowed.
- E2E uses deterministic intercepted portal responses.
- The affected-area coverage table has no unexplained gaps.
- The same unit/integration/E2E matrix passes before and after migration.
- Lint and relevant tests pass.
