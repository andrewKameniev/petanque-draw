# Refactoring

A refactor preserves chosen behavior while moving ownership. Do not combine an unrecorded product change with a reuse refactor.

## Safe extraction workflow

1. Name the duplicated responsibility and list every production consumer.
2. Read the relevant domain documentation and identify differences between copies.
3. Map unit, component, integration, and E2E coverage.
4. Add characterization tests against the current behavior before moving production code.
5. Define the new owner's narrow API and dependency direction.
6. Move one consumer, prove parity, then migrate the remaining consumers.
7. Delete obsolete implementations, styles, constants, and tests that only protected the copies.
8. Run focused checks after meaningful steps and expand validation when the
   change is broad or risky.
9. Update durable documentation only when its described contract changed.

If existing copies behave differently, capture the difference in fixtures first. Check documented tournament rules and product behavior, choose explicitly, and separate any intentional fix from the behavior-preserving move.

## Duplication rules

- A domain rule should have one canonical implementation when duplicated copies
  could produce different outcomes.
- Repeated UI is a primitive only when it is genuinely the same concept and the
  shared interface is simpler than the inline versions.
- There is no line-count threshold for extraction. Fifty readable, linear lines
  may be better kept together; a few repeated lines may deserve an owner when
  they encode an important rule.
- Similar-looking code with different meaning may remain separate. Do not create
  policy flags or a generic abstraction solely to remove visual repetition.
- Shared constants represent contracts; they are not a substitute for a service.
- Test builders are introduced when repetition obscures intent, not merely to minimize line count.

Search by behavior and persisted field names, not only by function name. Duplicate logic often uses different local names.

## Preserve boundaries

- Extract pure transformations before extracting I/O orchestration.
- Keep Firebase paths and legacy record compatibility unchanged unless migration is the task.
- Keep the Pinia façade stable while moving implementation behind it.
- Do not create a mega-service, generic `utils` module, or configuration dumping ground.
- Do not make a shared primitive depend on feature state to avoid designing its props/events contract.
- Keep rollback possible: small commits or steps, deterministic fixtures, and unchanged consumers until parity is proven.

## Proportional cleanup

Large legacy files do not force unrelated cleanup into a narrow fix. Improve the
area when the improvement is directly useful to the requested change; otherwise
keep scope small. Treat file size, repetition, and complexity as review signals,
not automatic failures. Extract when ownership, testability, reuse, or readability
gets better—not to satisfy a metric.

Use [the task template](../../tasks/TEMPLATE.md) only when multi-step work needs a
persistent handoff. See [Recent refactors](./recent-refactors.md) for extraction
patterns that succeeded in this repository.
