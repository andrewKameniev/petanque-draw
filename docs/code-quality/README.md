# Code quality

This directory is the durable engineering contract for new and changed code. Read this index, then only the document that matches the task. Do not load every file by default.

## Route by work type

| Work                                                                   | Read                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| State, Firebase, data shape, ownership, or lifecycle                   | [Architecture and boundaries](./architecture-and-boundaries.md) |
| Vue component, primitive, CSS, theme, accessibility, or i18n           | [Components and styles](./components-and-styles.md)             |
| Domain rule, service, defaults, status, error code, or shared constant | [Services and constants](./services-and-constants.md)           |
| Feature, bug fix, or regression coverage                               | [Testing](./testing.md)                                         |
| Behavior-preserving extraction or duplication cleanup                  | [Refactoring](./refactoring.md)                                 |
| Any change that can make documentation inaccurate                      | [Documentation](./documentation.md)                             |
| Why the current owners and guardrails exist                            | [Recent refactors](./recent-refactors.md)                       |

For implementation work, combine the relevant contract with [Testing](./testing.md). Read [Refactoring](./refactoring.md) only when moving existing behavior.

## Default guidance

- Search for the current owner before adding a component, service, constant, selector, or style.
- Put reusable or non-trivial domain decisions in one tested service; keep small,
  obvious presentation logic near its consumer.
- Reuse UI primitives when they make consumers clearer, and use semantic CSS
  tokens instead of hardcoded colors.
- Keep persisted machine values, defaults, access decisions, and error codes canonical.
- Add characterization or regression coverage before risky changes.
- Update durable documentation only when its contract would otherwise become
  inaccurate; update indexes only when the document set changes.
- Run focused checks while iterating and expand validation with the scope and
  risk of the change.

Legacy code is context, not a demand for opportunistic cleanup. A narrow change
should not grow into an architecture project merely because nearby debt exists.
