# Task: Reduce duplicate public live-data traffic

## Goal

Make the public and TV live-tournament runtimes load current data once, retain
granular realtime updates, and rely on Firebase reconnect behavior instead of
refetching the complete tournament on browser resume.

## Non-goals

- Changing Firebase paths, persisted tournament shapes, or database rules.
- Making public data system-, tab-, or Group-B-aware.
- Splitting route bundles or changing authenticated application bootstrap.

## Read first

- `docs/firebase.md`
- `docs/code-quality/architecture-and-boundaries.md`
- `docs/code-quality/services-and-constants.md`
- `docs/code-quality/testing.md`

## Context

- Current owner and consumers: `src/services/live-tournament.js` serves
  `src/views/Public.vue` and `src/views/TvDashboard.vue`; raw Firebase paths are
  owned by `src/services/db.js`.
- Important constraints: preserve legacy/envelope records, Group A/B behavior,
  public/TV field profiles, immutable updates, error states, and idempotent
  disposal.
- Existing coverage: `src/__tests__/live-tournament.spec.js` currently
  characterizes the full `get()` followed by listeners and explicit
  visibility/online reloads.

## Implementation outline

1. Add regression coverage for one cache-preserving initial load, no refetch on
   visibility/online restoration, same-source idempotence, and source changes.
2. Replace the awaited standalone `get()` plus cold child listeners with a
   parent-listener bootstrap and safe handoff to the existing granular plan.
3. Remove redundant browser resume listeners while preserving explicit retry,
   listener errors, cleanup, and stale-generation protection.

## Acceptance criteria

- [x] Initial public/TV loading does not transfer the complete record and then
      cold-start the same populated child paths.
- [x] Visibility and online events do not recreate listeners or show the loader.
- [x] Starting an unchanged source is a no-op; changing source fully disposes
      the previous generation.
- [x] Legacy/envelope and Group B creation/removal behavior remains covered.
- [x] Listener cleanup is idempotent and late callbacks are ignored.

## Test plan

- Focused command: `npm run test:run -- src/__tests__/live-tournament.spec.js src/__tests__/tournament-ref.spec.js`
- Broader checks warranted by risk: `npm run lint`, `npm run test:run`, and
  `npm run build` before the PR.
- E2E not required for this first PR because the injected service tests can
  prove request/listener ordering without remote Firebase writes.

## Documentation impact

- Update `docs/firebase.md` and `docs/architecture.md` if the live bootstrap or
  reconnect contract changes materially.
- No index change unless a document is added, moved, or removed.

## Completion evidence

- Changed behavior: public and TV sources bootstrap with a temporary parent
  listener, install granular listeners from the populated Firebase cache, and
  then remove the parent. Same-source starts and browser resume events no longer
  recreate the source; explicit reload remains the retry boundary.
- Exact commands and outcomes: focused live-source/consumer/reference run passed
  55 tests; full `npm run test:run` passed 1,215 tests in 71 files;
  `npm run lint`, `npm run build`, and `npm run docs:check` passed.
- Deferred follow-up with reason: the initial parent snapshot still transfers
  the complete authoritative record once. Phase-aware manifests and a compact
  public projection are separate tasks because they change hydration and
  persisted-data contracts.
- Documentation synchronized: `docs/architecture.md` and `docs/firebase.md`
  describe the cache-preserving handoff, native reconnect behavior, same-source
  idempotence, and missing-record hydration.
