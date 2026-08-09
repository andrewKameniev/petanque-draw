# Documentation

Documentation is part of the implementation contract. A task is incomplete when code, tests, and the durable explanation disagree.

## Route documentation impact

| Code or behavior changed                                         | Durable docs to review                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Tournament data shape, compatibility, or persisted field         | `docs/data-model.md`, `docs/firebase.md`                      |
| Store façade, synchronization, subscriptions, cleanup, ownership | `docs/main-store-architecture.md`, `docs/architecture.md`     |
| Tournament system or phase rule                                  | Relevant `docs/systems/*.md`, `docs/tournament-lifecycle.md`  |
| Ranking, pairing, lane, or score rule                            | `docs/ranking-algorithms.md` and relevant system doc          |
| Statistics or training behavior                                  | `docs/statistics.md`, `docs/training.md`, relevant system doc |
| E2E helpers, credentials, cleanup, fixtures, or commands         | `e2e/README.md`, `docs/e2e-testing.md`                        |
| Build, hosting, PWA, or external integration                     | `docs/deployment.md`, relevant technical doc                  |
| Engineering boundary or quality rule                             | This `docs/code-quality/` directory                           |
| New implementation task                                          | `tasks/README.md` and the task file                           |

Review means update when the description, path, example, command, or ownership is no longer true. Record `None — <reason>` in the task's documentation-impact field when no durable doc changes.

## Token-efficient documentation

- Keep each `README.md` an index with one-line routing descriptions.
- Put each rule in one canonical document and link to it; do not duplicate full instructions.
- Lead with the decision or invariant, then the minimum explanation and example.
- Use stable file paths and exported names; avoid source line references in canonical docs.
- Do not store current test totals, file counts, coverage snapshots, or temporary branch state in canonical docs.
- Put dated audit evidence in a clearly historical file such as `recent-refactors.md`.
- Split a document when readers routinely need only one independent section; add the new file to its nearest index.
- Remove or redirect obsolete guidance in the same change rather than leaving two authorities.

## Documentation completion gate

Before handoff:

1. Inspect the changed-file list.
2. Apply the routing table above.
3. Update affected docs; update the nearest index for every new, renamed, moved,
   or removed document.
4. Check relative Markdown links and referenced paths.
5. Confirm examples and commands match the current package scripts and architecture.
6. Include documentation impact in the completion summary.

For unfamiliar or cross-cutting changes, use the advisory router; validate
documentation changes before handoff:

```bash
npm run docs:impact -- <changed-code-paths...>
npm run docs:check
```

`docs:impact` is optional guidance for finding canonical docs and focused checks.
`docs:check` validates local links, index reachability, and lean index/agent
budgets. Neither requires rewriting an accurate document after an internal-only
change.

When behavior is generated from a canonical map, prefer generating inventories or parity checks from that source. Do not claim documentation updates itself unless an actual generator or check enforces it.

## Task versus durable documentation

`tasks/` records scope, acceptance criteria, and temporary execution evidence. `docs/` records durable behavior and architecture. On completion, move enduring knowledge into `docs/`; do not preserve completed task briefs as a second source of truth.
