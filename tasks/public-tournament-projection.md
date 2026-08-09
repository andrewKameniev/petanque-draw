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

- [x] Anonymous public/TV rendering can use only the projection for all systems
      and legacy/envelope source records.
- [x] Collaborators, emails, backups, editor-only configuration, and unused
      history are absent from the public shape.
- [x] Projection writes are atomic with canonical changes or have a tested
      recovery path.
- [x] Version fallback, stale data, permission errors, rollout, and rollback are
      covered.
- [x] Production migration/deployment remains a separately approved operation.

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

- Changed behavior: added the V1 `publicTournaments/{ownerUid}/{tournamentId}`
  envelope, exact public field/preference allowlists, recursive private-sentinel
  filtering, projection-first Public/TV reads, revision/stale handling, and
  canonical fallback for missing, partial, malformed, unsupported, or denied
  projections. Nested public values have a rules-enforced depth bound, and
  stream presets accept dense, bounded URL-only arrays. Canonical public-field writes,
  full saves, Group B transitions,
  archive media refresh, legacy archive migration, rename, and deletion now use
  atomic root multi-path projection updates. A projection permission failure
  retries the canonical operation for safe pre-rules rollout; other failures
  still surface.
- Exact commands and outcomes:
  - `rtk npm run test:run -- tests/public-tournament-projection.test.js src/__tests__/live-tournament.spec.js src/__tests__/public-readonly-side-effects.mounted.spec.js src/__tests__/group-b-store.spec.js tests/tournament-sync.test.js src/__tests__/archive-groups.mounted.spec.js src/__tests__/main-store-characterization.spec.js src/__tests__/results-shared-persistence.mounted.spec.js tests/archive-collaboration.test.js tests/archived-migration.test.js tests/user-map.test.js`
    — 11 files and 173 tests passed.
  - `rtk npm run test:rules` — the real Database Emulator ran 36 authorization,
    schema, privacy, scorer-scope, deletion, and atomic Group B tests; all passed.
  - `rtk npm run test:run` — 76 files and 1,272 tests passed; the emulator-only
    file was skipped here and passed through the dedicated command above.
  - `rtk npm run lint`, `rtk npm run build`, `rtk npm run docs:check`, and
    `rtk npm run check:secrets` — all passed; the build retained its informational
    dynamic-import/chunk-size warnings.
  - A generated 16-team, four-round envelope measured 36,045 JSON bytes versus
    15,627 bytes for V1 (20,418 bytes / 56.6% smaller). The fixture included
    duplicate restore/ranking history, collaborators, portal replacement data,
    player emails, and public presentation fields.
- Deferred follow-up with reason: remote Public/TV Playwright coverage was not
  run because `e2e/README.md` requires explicit `E2E_ALLOW_REMOTE=1` plus
  injected credentials and the suite can write to the live project. Production
  rules deployment, backfill, canonical-read revocation, destructive migration,
  and rollout remain separately approved operations.
- Documentation synchronized: `docs/data-model.md` owns the V1 shape and
  compatibility contract; `docs/firebase.md` owns path/rules/write recovery and
  rollout/rollback; `docs/architecture.md` owns the projection and reader data
  flows.
