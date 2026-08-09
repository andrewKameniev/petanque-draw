# Task: Load public tournament data by phase, tab, and group

## Goal

Preserve the projection-first Public/TV reader, and when it must use canonical
compatibility, load the smallest existing-schema Firebase paths needed for the
selected Public phase, tab, and group.

## Non-goals

- Changing the V1 public projection shape, splitting its complete-node
  subscription, or revoking current public read rules.
- Normalizing authoritative group/team storage in this task.
- Changing tournament ranking or phase semantics.

## Read first

- `docs/data-model.md`
- `docs/firebase.md`
- `docs/systems/README.md`, then the affected system documents
- `docs/code-quality/architecture-and-boundaries.md`
- `docs/code-quality/testing.md`

## Context

- Depends on the stable live-source lifecycle from
  `public-live-network-bootstrap.md`.
- Also depends on the projection-first contract from
  `public-tournament-projection.md`: a valid V1 record is read through one
  complete projection-node subscription and never enters phase-aware planning.
- The phase/tab/group plan applies only after a missing, invalid, unsupported,
  or denied projection switches Public to canonical compatibility. TV's
  canonical fallback remains a fixed profile.
- Existing arrays and legacy/envelope compatibility limit partial queries;
  prefer explicit small manifests/selectors over duplicated format detection.

## Implementation outline

1. Keep valid V1 projection reads on their existing complete-node subscription.
2. Define and characterize critical, system-specific, and tab-specific plans
   for canonical Public compatibility, including bounded latest-round reads.
3. Load enough canonical metadata to choose a plan, then promote and demote
   optional listeners as the Public selection changes.
4. Observe unselected canonical Tournament B through a bounded existence query
   and subscribe its full node only when B is selected.
5. Leave TV canonical compatibility on its static, cache-preserving handoff.

## Acceptance criteria

- [x] A valid V1 projection uses one complete-node subscription and does not
      start canonical phase/tab/group listeners.
- [x] Canonical normal-round Public views avoid TIR and inactive playoff
      payloads, and non-round tabs demote current-match-only listeners.
- [x] Canonical TIR views avoid standard history, group, and elimination
      payloads that they do not render.
- [x] Canonical history and system-specific payloads are promoted only for the
      tabs that render them, while exact presentation data remains available.
- [x] Unselected canonical Tournament B uses only a bounded existence query;
      its full node loads only when B is selected, and creation/removal remains
      reflected in the switcher.
- [x] TV canonical compatibility retains its static subscription profile.
- [x] Projection and canonical paths preserve presentation parity for all
      supported persisted formats and tournament systems.

## Test plan

- Focused command: live-source, tournament-record, and public presentation tests.
- Broader checks warranted by risk: full unit suite, lint, build, and targeted
  public E2E only in the explicitly enabled isolated Firebase harness.
- Prove the complete projection path separately from canonical listener counts,
  selectors, and paths for representative Swiss, groups, playoff, TIR, and A/B
  fixtures.

## Documentation impact

- Update `docs/architecture.md` and `docs/firebase.md` with the staged public
  loading contract.

## Completion evidence

- Changed behavior: Valid V1 reads remain on one complete projection listener.
  Canonical Public compatibility now discovers the persisted format, reconciles
  phase/tab/group listeners, uses bounded first/last-child queries, and loads
  the full Tournament B node only while B is selected. TV remains static.
- Exact commands and outcomes:
  - `npm run test:run -- src/__tests__/live-tournament.spec.js src/__tests__/live-tournament-phase-aware.spec.js src/__tests__/tournament-record-consumers.spec.js`
    — 3 files and 57 tests passed.
  - `npm run test:run -- src/__tests__/presentation-parity.spec.js src/__tests__/public-game-card.spec.js tests/archive-collaboration.test.js tests/tournament-record.test.js tests/tournament-sync.test.js`
    — 5 files and 65 tests passed.
  - `npx vitest related --run src/services/db.js` — 29 files and 294 tests
    passed.
  - `npm run test:run` — 77 files and 1,288 tests passed; the database-rules
    suite and its 36 tests were skipped without the emulator environment.
  - `npm run lint`, `npm run build`, `npm run docs:check`, and
    `git diff --check` — passed. The build retained its existing dynamic-import
    and chunk-size warnings.
- Deferred follow-up with reason: `npm run test:rules` and targeted public E2E
  remain deferred because they require the explicitly enabled isolated Firebase
  emulator/harness and perform external writes.
- Documentation synchronized: `docs/architecture.md` and `docs/firebase.md`
  describe the verified projection-first, dynamic Public fallback, static TV,
  bounded-query, and Tournament B contracts.
