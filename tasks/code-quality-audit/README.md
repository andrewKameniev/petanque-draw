# Code Quality Refactoring Tasks

These briefs convert the code reuse/duplication audit into standalone implementation tasks. Each Markdown file is written so it can be given directly to an implementation agent.

## Tasks

| #   | Task                                                                            | Primary risk area                     | Dependencies                                |
| --- | ------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| 1   | [Extract `PublicGameCard`](./01-extract-public-game-card.md)                    | Public match rendering                | None                                        |
| 2   | [Consolidate tir domain logic](./02-consolidate-tir-domain-logic.md)            | Tir scoring/playoff behavior          | Coordinate with Task 9                      |
| 3   | [Canonical tournament adapter](./03-canonical-tournament-adapter.md)            | New/legacy record compatibility       | None                                        |
| 4   | [Decompose the main store](./04-decompose-main-store.md)                        | Firebase sync, archive, collaboration | Prefer Task 3 first; coordinate with Task 5 |
| 5   | [Unify public live subscriptions](./05-unify-public-live-subscriptions.md)      | Public/TV realtime updates            | Prefer Task 3 first                         |
| 6   | [Consolidate group ranking](./06-consolidate-group-ranking.md)                  | Tournament standings/rules            | None                                        |
| 7   | [Unify presentation selectors](./07-unify-tournament-presentation-selectors.md) | Public/archive/TV metadata            | Prefer Tasks 3 and 6 where applicable       |
| 8   | [Extract portal player sync](./08-extract-portal-player-sync.md)                | Player identity/media updates         | Prefer Task 3 for storage targets           |
| 9   | [Consolidate shared UI primitives](./09-consolidate-shared-ui-primitives.md)    | Visual/responsive consistency         | Coordinate with Tasks 1 and 2               |

## Mandatory Regression-Coverage Gate

Every task must follow this sequence:

1. **Map affected behavior.** Review the task's affected-area table and search the current unit, component, integration, and E2E suites.
2. **Identify gaps.** Do not assume `npm run test:run` covers a behavior merely because a related file has tests.
3. **Add characterization coverage first.** Missing tests must be added against the current implementation and pass before production refactoring starts.
4. **Record the baseline.** Save the exact focused commands and results in the task/PR summary.
5. **Refactor incrementally.** Run the focused matrix after each meaningful extraction, not only at the end.
6. **Compare before/after.** The same deterministic fixtures, unit assertions, E2E flows, and relevant visual snapshots must pass afterward.
7. **Run the full safety net.** Finish with lint and the complete unit suite, plus all affected E2E suites.

If current copies behave differently, the agent must not silently choose one behavior. It must:

- Capture the difference in a test/fixture
- Check documented tournament rules and existing product behavior
- Mark the chosen behavior explicitly
- Separate an intentional bug fix from a behavior-preserving reuse refactor

## General Constraints

- Read `CLAUDE.md` and `e2e/README.md` before implementation/E2E work.
- Preserve unrelated user changes in the worktree.
- Preserve Firebase paths and backward compatibility unless the task explicitly says otherwise.
- Every E2E-created tournament must be deleted, including on failure.
- Prefer deterministic fixtures and intercepted third-party responses over live external dependencies.
- Use the smallest focused test command during iteration, then run the full required safety net.
- Do not update visual snapshots blindly; inspect and explain diffs.

## Suggested Execution Strategy

Tasks 1, 6, and 8 are relatively bounded extractions. Tasks 2, 3, and 5 affect larger feature boundaries. Task 4 should be staged last among the data-architecture tasks so it can reuse the adapter/subscription work instead of creating temporary abstractions. Task 9 should be coordinated with Tasks 1 and 2 to avoid editing the same templates/styles concurrently.
