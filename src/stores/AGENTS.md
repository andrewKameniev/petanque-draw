# Store scope

Before editing Pinia state, read `../../docs/code-quality/README.md`, [architecture and boundaries](../../docs/code-quality/architecture-and-boundaries.md), and [testing](../../docs/code-quality/testing.md). Read [services and constants](../../docs/code-quality/services-and-constants.md) when adding a rule or persisted contract.

- Keep `main.js` an application-facing façade; delegate domain transitions and effect runtimes.
- Apply pure service results to reactive state, then synchronize through the established service.
- Do not reimplement canonical record, ranking, playoff, timer, TIR, archive, or portal rules.
- Preserve public getter/action names unless an explicit migration covers every consumer.
- Keep runtime state instance-scoped; no exported mutable module globals.
- Dispose subscriptions, timers, debounces, and echo markers on tournament/user lifecycle changes.
- Preserve exact Firebase targets and legacy/current record behavior.
- Multi-write actions define validation, ordering, rollback, and user-visible failure outcomes.
- Extend characterization tests for façade changes and add focused service tests for moved logic.
