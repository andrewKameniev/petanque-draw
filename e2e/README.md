# End-to-End Tests

The Playwright suite currently uses the configured remote Firebase project and
can create users and tournament data. It is disabled by default.

Read [the scoped agent rules](./AGENTS.md) before changing or running E2E tests.

## Required opt-in

Run remote E2E only with explicit approval for that external write. Supply
credentials through the environment; there are no repository defaults:

```bash
export E2E_ALLOW_REMOTE=1
export E2E_TEST_EMAIL='<test account email>'
export E2E_TEST_PASSWORD='<test account password>'
```

Tests that create shared-tournament fixtures also require:

```bash
export E2E_SHARED_OWNER_EMAIL='<fixture owner email>'
export E2E_SHARED_OWNER_PASSWORD='<fixture owner password>'
```

Without the opt-in or required credentials, suite loading fails before a
browser or Firebase fixture can write. Never add fallback credentials, print
their values, or place them in tracked files. Prefer Auth and Realtime Database
emulators for new write-heavy coverage when an emulator harness is available.

## Commands

```bash
npm install
npx playwright install chromium
npm run e2e
npm run e2e:headed
npm run e2e:ui
npx playwright test e2e/swiss.spec.js
npx playwright test -g "8 teams — swiss + cadrage"
```

The dev server uses `http://localhost:5173` unless `E2E_PORT` is set.

## Test design

- Use public UI behavior for browser assertions; use `firebase-fixtures.js`
  only for deterministic setup and teardown.
- Give each fixture a unique ID and name.
- Delete every tournament created by a test, including failure paths.
- Keep third-party responses deterministic; do not depend on mutable portal
  data when an intercepted response or fixture can prove the behavior.
- Prefer observable state over arbitrary sleeps. Never update screenshots or
  expected output without inspecting and explaining the change.

Common UI flows live in `helpers.js`. Direct database setup and cleanup live in
`firebase-fixtures.js`.
