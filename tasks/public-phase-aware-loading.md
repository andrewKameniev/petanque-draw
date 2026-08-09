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

- [ ] Normal current-round loads avoid TIR and inactive playoff payloads.
- [ ] TIR loads avoid standard history/group payloads that it does not render.
- [ ] Ranking/Results history and detailed Teams data load on demand.
- [ ] Group B data is not transferred until selected, while creation/removal is
      still reflected in the switcher.
- [ ] All supported persisted formats and systems retain presentation parity.

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

- Changed behavior:
- Exact commands and outcomes:
- Deferred follow-up with reason:
- Documentation synchronized:
