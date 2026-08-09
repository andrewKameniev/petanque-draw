# Petanque Draw agent contract

Default to the smallest useful context, the simplest readable implementation,
and validation proportional to risk.

## Start lean

1. Run `git status --short --branch` and preserve existing work.
2. Fetch `origin/develop` only when the task depends on the latest remote state;
   if fetching fails, do not describe the local ref as current.
3. Read [docs/README.md](docs/README.md), then only the document routed to the
   change. Use [tasks/README.md](tasks/README.md) only when the user points to a
   task file; ordinary requests need no task brief.
4. Search the current owner, consumers, tests, constants, and primitives before
   adding a file or abstraction.
5. Read the nearest scoped `AGENTS.md` before editing in that directory.
6. Use `npm run docs:impact -- <paths...>` only for unfamiliar, cross-layer, or
   refactoring work. Skip it when routing is already clear.

## Code Review Rules

- **WORKTREE-001 — Preserve work.** Existing edits and untracked files are
  user-owned. Do not discard or reformat unrelated work. Review is read-only;
  commit, push, deploy, migration, and remote-data changes require matching
  authorization.
- **DESIGN-001 — Prefer clarity.** There are no extraction, file-size, function,
  or duplication line thresholds. Keep even a long block local when it is one
  readable flow. Extract only when ownership, reuse, testing, or comprehension
  improves. Avoid speculative APIs, pass-through wrappers, and generic `utils`.
- **OWNER-001 — One important rule, one owner.** Do not create a second
  calculation, state copy, fallback, or persistence path for the same behavior.
  Similar-looking code may remain separate when it represents different policy.
- **BOUNDARY-001 — Use boundaries where they help.** Components render and
  orchestrate; keep small presentation decisions local. Tested services own
  reusable or non-trivial domain decisions. Pinia applies reactive state;
  focused effect services own persistence, subscriptions, cleanup, and rollback.
- **UI-001 — Reuse deliberately.** Extract a primitive only when multiple
  consumers share the same concept and a clear props/events API makes them
  easier to read. Follow the existing Vue Options API and preserve accessibility
  and all four locales for affected UI.
- **STYLE-001 — Use semantic tokens.** New feature CSS consumes `var(--...)`.
  Raw colors belong in token registries or documented brand, SVG, canvas, or
  export cases.
- **CONTRACT-001 — Centralize stable machine values.** Persisted statuses, roles,
  phases, error codes, and shared defaults use domain-local frozen constants or
  factories. Keep obvious one-use presentation values local.
- **TEST-001 — Match proof to risk.** Add a regression for reproducible bugs and
  characterization when risky existing behavior is not already protected. Use
  focused unit or mounted tests first; add integration/E2E only when the changed
  contract requires it.
- **DOC-001 — Document durable changes.** Update a canonical document only when
  its rule, data shape, owner, workflow, or public behavior changes. Update an
  index only when documents are added, moved, renamed, or removed.
- **CI-001 — Do not bypass relevant gates.** Do not weaken or skip a check merely
  to make it pass. Report relevant checks that could not run.

## Route by change

| Area                        | Read                                                                             |
| --------------------------- | -------------------------------------------------------------------------------- |
| Vue/UI/CSS                  | `src/components/AGENTS.md`, `docs/code-quality/components-and-styles.md`         |
| Services/domain/constants   | `src/services/AGENTS.md`, `docs/code-quality/services-and-constants.md`          |
| Pinia/persistence/lifecycle | `src/stores/AGENTS.md`, `docs/code-quality/architecture-and-boundaries.md`       |
| Tournament behavior         | `docs/systems/README.md`, then only the affected system                          |
| Tests/E2E                   | `docs/code-quality/testing.md`; for E2E also `e2e/AGENTS.md`                     |
| Refactoring                 | `docs/code-quality/refactoring.md`; use recent-refactor history only when useful |
| Docs/tasks                  | `docs/AGENTS.md` or `tasks/AGENTS.md`                                            |

## Finish proportionally

1. Make the smallest coherent change and run the focused test that proves it.
2. Review the final diff and preserve unrelated work.
3. Documentation-only changes run `npm run docs:check`. Narrow code changes run
   focused tests and relevant lint. Broad, risky, or PR-ready changes also run
   the full unit suite and build. Run E2E only when its value justifies the setup
   and external effects. Report what ran and any meaningful omission.
