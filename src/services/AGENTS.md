# Service scope

Before editing a service, read `../../docs/code-quality/README.md`, then [services and constants](../../docs/code-quality/services-and-constants.md) and [testing](../../docs/code-quality/testing.md). Add [architecture and boundaries](../../docs/code-quality/architecture-and-boundaries.md) for persistence or lifecycle work.

- Search for the current responsibility owner before adding a module or export.
- Prefer pure functions: explicit inputs, immutable outputs, no Pinia or i18n.
- Inject clocks, randomness, Firebase/HTTP adapters, and browser targets when relevant.
- Effect services define errors, write ordering, rollback, retry, and idempotent cleanup.
- Preserve Firebase paths and legacy/envelope compatibility unless migration is in scope.
- Use frozen maps/arrays for shared machine contracts and one factory for mutable defaults.
- Do not add a catch-all `utils`, `common`, or mega-service.
- Return stable codes/results; components own localized presentation.
- Add focused tests for the relevant public behavior and realistic edge,
  compatibility, error, or cleanup cases. Do not chase a percentage when it
  adds assertions without useful confidence.
