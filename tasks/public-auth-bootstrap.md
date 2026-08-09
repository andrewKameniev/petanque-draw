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

- [ ] A public initial route never calls `getTournaments()` because the router
      is still at its start location.
- [ ] Public rendering is not blocked on `authStateReady()`.
- [ ] Signed-in public loads do not rewrite `emails/{email}`.
- [ ] Private route guards, current-tournament selection, logout, and user
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

- Changed behavior:
- Exact commands and outcomes:
- Deferred follow-up with reason:
- Documentation synchronized:
