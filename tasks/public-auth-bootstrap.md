# Task: Decouple public routes from authenticated bootstrap

## Goal

Allow direct public, TV, public-statistics, and custom-slug routes to mount
without waiting for authenticated editor initialization or loading/writing
private account data.

## Non-goals

- Changing sign-in, sign-up, or authenticated route behavior.
- Changing public tournament subscription profiles or route bundle splitting.
- Removing Firebase Auth from features that genuinely require it.

## Read first

- `docs/architecture.md`
- `docs/firebase.md`
- `docs/main-store-architecture.md`
- `docs/code-quality/architecture-and-boundaries.md`
- `docs/code-quality/testing.md`

## Context

- Current owners: `src/main.js` coordinates route/auth startup;
  `src/stores/main.js` owns the application-facing user state;
  `src/services/archive-collaboration.js` loads owned/shared tournaments.
- Initial lazy navigation can leave `router.currentRoute` at `/` while auth
  resolves, causing a signed-in public visitor to load the full private
  tournament collection.
- `loginUser()` also writes `emails/{email}` on every signed-in page load.

## Implementation outline

1. Characterize public initial navigation with auth resolving before and after
   the lazy route.
2. Mount public routes independently while retaining auth gates for private
   routes and preserving authenticated in-app navigation.
3. Move email-index synchronization to the narrow account lifecycle that owns
   it, or make it explicitly idempotent and absent from public startup.

## Acceptance criteria

- [x] A public initial route never calls `getTournaments()` because the router
      is still at its start location.
- [x] Public rendering is not blocked on `authStateReady()`.
- [x] Signed-in public loads do not rewrite `emails/{email}`.
- [x] Private route guards, current-tournament selection, logout, and user
      switching retain their existing behavior.

## Test plan

- Focused command: extend routing/store startup tests under `src/__tests__/`.
- Broader checks warranted by risk: full unit suite, lint, and production build.
- Add E2E only if router-level tests cannot prove initial-navigation ordering;
  do not use remote Firebase fallback data.

## Documentation impact

- Update `docs/architecture.md`, `docs/firebase.md`, and
  `docs/main-store-architecture.md` if startup or email-index ownership moves.

## Completion evidence

- Changed behavior: the app mounts before auth resolution; only `/` and
  `meta.requiresAuth` navigation waits for auth and loads private tournaments.
  Passive auth restoration applies user state without rewriting the email
  index, while explicit successful sign-up/sign-in keeps that index current.
- Exact commands and outcomes: the focused startup/auth/routing/archive command
  passed 59 tests in 5 files; full `npm run test:run` passed 1,237 tests in 73
  files; `npm run lint`, `npm run build`, and `npm run docs:check` passed.
- Deferred follow-up with reason: E2E was not added because deterministic
  router/auth integration tests prove both initial-navigation orderings without
  remote Firebase data. Read-only side effects, route code splitting,
  phase-aware loading, and public projections remain isolated follow-up tasks.
- Documentation synchronized: `docs/architecture.md`, `docs/firebase.md`, and
  `docs/main-store-architecture.md` describe startup gating and email-index
  ownership.
