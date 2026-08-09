# Recent refactors: lessons from PRs #153–#190

This is dated evidence from merges on 2026-08-05 through 2026-08-08. It explains the current contracts; the other files in this directory remain normative. Not every number in the range was merged.

## What changed

| Merged PRs | Change                                                                                                                                                                                           | Enduring lesson                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #153–#160  | Shared `PublicGameCard`, consolidated TIR domain workflows, canonical tournament adapter, store decomposition foundations, portal sync extraction, public live source, and shared UI primitives  | Characterize consumers first, create one owner, then migrate callers. A reusable component needs a props/emits contract; a reusable rule needs a pure service.                                                           |
| #161–#170  | Paused-timer regression fix plus focused coverage and documentation hardening for primitives, group ranking, public game cards, TIR, live subscriptions, tournament records, and store lifecycle | Extraction is not finished when the happy path passes. Cover legacy data, paused/reconnect states, cleanup, public/admin parity, and ownership documentation.                                                            |
| #171–#175  | Shared presentation selectors, main-store runtime extraction, portal player synchronization, numeric score coercion, `ScrollButtons`, and archived navigation reuse                              | Normalize/coerce once at a boundary. Keep Pinia as a façade. Small primitives can remove substantial template/CSS duplication without importing feature state.                                                           |
| #177–#178  | Archive index/backup work followed by ownership, filtering, and database-rule corrections                                                                                                        | Multi-path persistence needs an explicit authority model, ordering, rollback, and rules tests. A UI guard is not authorization.                                                                                          |
| #180–#187  | TIR playoff byes, ranking-table separation, Group B archive ownership, playoff UI regressions, public archive access, result regressions, and portal-link publishing                             | Product fixes should land with the smallest regression test that proves the reported case. Access and Group A/B behavior must be tested across service, mounted consumer, and rules boundaries.                          |
| #189–#190  | Playoff lane/revert corrections and safe admin team replacement                                                                                                                                  | Reversible transitions need a pure plan, validation before writes, exact synchronization paths, and regression coverage for partial/legacy records. New UI should remain an intent surface over the service/store owner. |

## Patterns that worked

### Characterize, then extract

The successful service refactors first locked existing Pinia APIs or consumer output, then moved logic behind the same façade. This reduced migration risk and made behavior differences visible instead of silently selecting one copy.

### Pure core, injected effects

Tournament record, ranking, timer, replacement, and TIR logic became testable by accepting data and returning next state. Live synchronization became testable by injecting services and browser targets and proving idempotent cleanup.

### Parity tests matter

Public, archived, TV, admin, and training views had independently evolved. Consumer-parity and mounted tests caught differences that isolated unit coverage missed. A shared implementation still needs tests at its integration seams.

### Coverage follow-ups reveal incomplete refactors

Several extraction PRs were followed immediately by coverage/docs PRs. The lasting workflow is to include edge coverage, lifecycle cleanup, consumer checks, and durable ownership docs in the original task rather than treating them as optional follow-up.

### Compatibility is a boundary concern

Legacy and envelope tournament records, string scores, absent Group B data, byes, and archived ownership repeatedly caused regressions. Normalize and validate these cases at canonical boundaries; do not spread defensive shape checks through components.

### Reuse must stay narrow

`TournamentNav`, TIR scoring controls, `RoundTimerControls`, `ScrollButtons`, and `PublicGameCard` succeeded because each owns a specific reusable interaction. The large feature shells remain orchestration/decomposition targets, not examples for new component size.

## Rule derived from the period

For future work, completion means one canonical owner, focused regression coverage, consumer integration proof, cleanup/error behavior where relevant, and synchronized durable docs. Passing the existing suite alone is not enough.
