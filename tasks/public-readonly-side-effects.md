# Task: Remove read-only public side effects

## Goal

Ensure public read-only components neither attach editor subscriptions nor make
permission/account requests that cannot affect their rendered UI.

## Non-goals

- Refactoring the whole editor synchronization service.
- Changing ranking, playoff, or TIR domain rules.
- Introducing new public Firebase paths.

## Read first

- `docs/architecture.md`
- `docs/code-quality/components-and-styles.md`
- `docs/code-quality/architecture-and-boundaries.md`
- `docs/code-quality/testing.md`

## Context

- `Public.vue` renders `TeamPlayoff` read-only without its public tournament;
  the child falls back to Pinia and unconditionally subscribes the editor
  profile.
- `Ranking.vue` checks tournament-organizer access for signed-in users even
  though all related actions are disabled by `readOnly`.
- Public live fields include `activeGroup`, `tirTiebreakerActive`, and
  `tirTiebreakerParticipantIds`, which have no public consumer.

## Implementation outline

1. Add mounted regressions for read-only Team Playoff and Ranking.
2. Pass external tournament state explicitly and skip editor subscriptions in
   read-only mode.
3. Gate organizer lookup behind the editable action capability and tighten the
   public profile only after consumer searches and live-name coverage.

## Acceptance criteria

- [ ] Public Team Playoff renders the public record and starts no Pinia editor
      listeners.
- [ ] Read-only Ranking performs no organizer lookup, including on remount.
- [ ] No rendered public field loses realtime updates.
- [ ] Editable/admin versions retain their current subscription and capability
      behavior.

## Test plan

- Focused command: mounted component tests plus
  `src/__tests__/live-tournament.spec.js`.
- Broader checks warranted by risk: relevant lint and full unit suite before PR.
- E2E not required if component/service seams are covered without remote data.

## Documentation impact

- `None` unless read-only component ownership or the documented public live
  profile changes materially.

## Completion evidence

- Changed behavior:
- Exact commands and outcomes:
- Deferred follow-up with reason:
- Documentation synchronized:
