# Services and constants

Services are the canonical owners of reusable rules. They should make components smaller, but moving a large component method into one large miscellaneous service is not a complete refactor.

## Service shapes

Prefer one of these explicit shapes:

### Pure domain service

- Receives all data and policy inputs as arguments.
- Returns new data or a stable result object.
- Does not mutate inputs, read Pinia, translate text, or perform I/O.
- Injects time, randomness, or policy when determinism matters.

Examples: group ranking, tournament record normalization, timer transitions, playoff rules, and TIR scoring.

### Effect/runtime service

- Receives Firebase/HTTP/browser adapters rather than importing hidden mutable state where practical.
- Separates planning/transformation from execution.
- Exposes deterministic, idempotent cleanup for subscriptions and debounces.
- Returns stable error codes or throws documented errors; components choose localized copy.

Examples: tournament synchronization, live tournament sources, archive collaboration, and portal transport.

### Persistence adapter

- Owns raw paths and SDK operations.
- Does not contain presentation decisions.
- Is called by a domain/runtime service or store façade, not by new component code.

## Constants and defaults

This JavaScript project uses frozen objects and arrays instead of TypeScript enums.

Create a shared constant when a value is:

- persisted or sent across a service boundary;
- compared in more than one production module;
- an access capability, status, system, phase, error code, field set, or protocol key;
- a default whose duplication could change behavior.

Good established forms include `LIVE_TOURNAMENT_PROFILES`, `TOURNAMENT_REF_ERROR`, tournament Group A/B constants, training status/type maps, and TIR scoring/distance definitions.

Rules:

- use descriptive exported names and `Object.freeze` for enum-like maps or shared arrays;
- keep machine values stable and language-neutral;
- expose a factory when callers need mutable default objects;
- use `??` when zero, `false`, or an empty string is valid; do not let `||` silently replace valid state;
- centralize access identities and capability decisions instead of embedding emails or UIDs in components;
- keep a one-use, obvious presentation literal local; do not build a constants dumping ground.

Defaults have one owner. A component may display the canonical value but must not invent a second fallback. Changing a persisted default requires compatibility tests and a data-model or feature-doc review.

## Cohesion guidance

For new code:

- one service module owns a recognizable domain responsibility;
- no new `utils.js`, `common.js`, or catch-all service without a narrowly documented domain;
- no duplicated implementation of a rule already present in another service;
- no exported mutable module-global runtime state.

Review long files and functions for mixed responsibilities, but do not split
tightly coupled steps just to reduce a metric. A longer linear function can be
clearer than several helpers with weak names or parameter plumbing. Extract when
the new boundary improves ownership, testing, reuse, or local comprehension.

## Error and result contracts

- Validate at the service boundary and fail with a stable code or structured result.
- Preserve the original cause for diagnostics without showing raw backend text to users.
- Keep authorization failures distinct from missing data and validation failures.
- For multi-write effects, define success, partial failure, rollback, and retry behavior.
- Components translate codes and decide presentation; services do not import the i18n singleton.

## Tests

Add focused tests for changed decisions and meaningful boundary, compatibility,
error, or disposal behavior. Small wiring changes can rely on an existing
integration test when that test directly proves the contract. See
[Testing](./testing.md) for proportional validation.
