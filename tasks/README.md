# Tasks

Task files are short-lived implementation contracts. Durable architecture and behavior belong in `docs/`.

## When to create a task file

Use a task file only for work that spans multiple steps, handoffs, or sessions
and benefits from persistent execution state. An ordinary issue or focused edit
does not need one.

1. Copy [TEMPLATE.md](./TEMPLATE.md) to `tasks/<short-slug>.md`.
2. Fill the goal, boundaries, behavior, tests, documentation impact, and completion evidence.
3. Link it below while active.
4. On completion, move enduring decisions into the relevant docs and remove the completed task brief when it no longer adds value.

For engineering-quality work, route through [code-quality/README.md](./code-quality/README.md) and the canonical [code-quality docs](../docs/code-quality/README.md).

Scoped agent instructions: [AGENTS.md](./AGENTS.md).

## Active tasks

No task briefs are indexed here yet.

Do not restore the completed `tasks/code-quality-audit/` briefs. Their enduring lessons are summarized in [recent refactors](../docs/code-quality/recent-refactors.md).
