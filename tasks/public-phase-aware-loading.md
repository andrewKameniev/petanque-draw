# Task: Load public tournament data by phase, tab, and group

## Goal

Load the smallest existing-schema Firebase paths needed for first paint, then
activate history, detailed teams, system-specific data, and Group B only when
the public UI needs them.

## Non-goals

- Introducing the final public projection or revoking current public read rules.
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
- Public currently uses one fixed field profile for Swiss, groups, playoffs,
  team playoff, and TIR, and subscribes the complete B node while starting on A.
- Existing arrays and legacy/envelope compatibility limit partial queries;
  prefer explicit small manifests/selectors over duplicated format detection.

## Implementation outline

1. Define and characterize critical, system-specific, tab-specific, and Group B
   subscription plans.
2. Load enough metadata to choose a plan, subscribe current-phase data, and
   promote/demote optional listeners as UI state changes.
3. Preserve live Group B creation/removal and lazy-load its full data on viewer
   selection.

## Acceptance criteria

- [x] Normal current-round loads avoid TIR and inactive playoff payloads.
- [x] TIR loads avoid standard history/group payloads that it does not render.
- [x] Ranking/Results history and detailed Teams data load on demand.
- [x] Group B data is not transferred until selected, while creation/removal is
      still reflected in the switcher.
- [x] All supported persisted formats and systems retain presentation parity.

## Test plan

- Focused command: live-source, tournament-record, and public presentation tests.
- Broader checks warranted by risk: full unit suite, lint, build, and targeted
  public E2E only in the explicitly enabled isolated Firebase harness.
- Measure listener counts and payload paths for representative Swiss, groups,
  playoff, TIR, and A/B fixtures.

## Documentation impact

- Update `docs/architecture.md` and `docs/firebase.md` with the staged public
  loading contract.

## Completion evidence

- Changed behavior: Public now discovers legacy/envelope format through scalar
  paths, reconciles exact phase/tab listener plans, queries only the latest
  standard round for current and elimination views, promotes full history and
  detailed teams on demand, and watches only Tournament B presence probes until
  B is selected. TIR remains isolated from standard/group payloads, normalized
  preference defaults and stream presets retain presentation parity, and an
  asynchronous tab/group promotion remains loading until its listeners are
  initialized. The static TV lifecycle from Task 1 is unchanged.
- Exact commands and outcomes:
  - `npm run test:run -- src/__tests__/live-tournament-phase-aware.spec.js src/__tests__/live-tournament.spec.js src/__tests__/tournament-record-consumers.spec.js tests/tournament-record.test.js tests/tournament-presentation.test.js src/__tests__/presentation-parity.spec.js src/__tests__/public-game-card.spec.js` — 7 files, 149 tests passed.
  - `npm run test:run` — 72 files, 1,253 tests passed.
  - `npm run lint` — ESLint, tooling lint, Stylelint, and Prettier passed.
  - `npm run docs:check` — 59 Markdown files passed.
  - `npm run build` — production build passed (2,586 modules); existing dynamic-import and chunk-size warnings remain.
  - `npm run quality:diff` — passed against the Task 1 base commit with 9 changed files.
  - `git diff --check` — passed.
- Deferred follow-up with reason: Targeted public E2E was not run because no
  explicitly enabled isolated Firebase harness was provided. The final public
  projection remains owned by Task 6 and is intentionally not introduced here.
- Documentation synchronized: `docs/architecture.md` and `docs/firebase.md`
  describe scalar discovery, phase/tab promotion, latest-round queries,
  selection loading, stream paths, lazy Tournament B, and the unchanged TV
  bootstrap contract.
