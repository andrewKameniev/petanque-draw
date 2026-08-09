# Task: Publish a versioned public tournament projection

## Goal

Introduce a compact, versioned Firebase read model containing only public
metadata and presentation data, migrate public/TV readers safely, and prepare
rules to stop anonymous reads of authoritative editor records.

## Non-goals

- Deploying rules, running a production backfill, or deleting legacy data
  without separate explicit authorization.
- Rewriting tournament algorithms or all authoritative storage shapes.
- Combining hosting/bundle optimization with the data migration.

## Read first

- `docs/data-model.md`
- `docs/firebase.md`
- `docs/architecture.md`
- `docs/code-quality/architecture-and-boundaries.md`
- `docs/code-quality/services-and-constants.md`
- `docs/code-quality/testing.md`
- `e2e/README.md` before any rules/emulator coverage

## Context

- Depends on the public lifecycle and staged-loading contracts being stable.
- Current rules allow anonymous reads of the complete authoritative tournament,
  including collaborators and editor-only metadata.
- Projection maintenance needs one owner, atomic multi-path behavior, legacy
  fallback during rollout, and explicit stale/partial-write handling.

## Implementation outline

1. Specify the projection version, public shape, writer/derivation owner,
   compatibility fallback, and rollout/rollback sequence.
2. Add rules-emulator coverage and atomic projection updates for every public
   field owner.
3. Dual-read/dual-write through a measured migration window; prepare, but do
   not execute, backfill and authoritative-read revocation steps.

## Acceptance criteria

- [ ] Anonymous public/TV rendering can use only the projection for all systems
      and legacy/envelope source records.
- [ ] Collaborators, emails, backups, editor-only configuration, and unused
      history are absent from the public shape.
- [ ] Projection writes are atomic with canonical changes or have a tested
      recovery path.
- [ ] Version fallback, stale data, permission errors, rollout, and rollback are
      covered.
- [ ] Production migration/deployment remains a separately approved operation.

## Test plan

- Focused command: projection service tests and Firebase Rules Emulator tests.
- Broader checks warranted by risk: full unit, lint, build, and isolated public
  E2E across systems and record formats.
- Record representative canonical versus projection payload sizes.

## Documentation impact

- Update `docs/data-model.md`, `docs/firebase.md`, and `docs/architecture.md`.
- Add a migration/runbook document only if it becomes the durable operational
  owner; update `docs/README.md` only if a document is added.

## Completion evidence

- Changed behavior:
- Exact commands and outcomes:
- Deferred follow-up with reason:
- Documentation synchronized:
