# E2E Tests (Playwright)

Read root `AGENTS.md` and `RTK.md` before browser work.

## Safety boundary

Write-capable E2E runs only against the local Firebase Authentication and
Realtime Database emulators using project `demo-petanque-draw`. The runner
creates disposable users at runtime. There are no shared test credentials.

Do not invoke the application E2E suite with raw `npx playwright test` or point
it at an existing server. `playwright.config.js` intentionally aborts unless the
emulator mode, demo project, and both loopback hosts are present. Missing an
emulator is a failure, never a reason to use a shared Firebase project.

## Setup and commands

Requirements: Node/npm, Java 21 or newer for the RTDB emulator, and Chromium.

```bash
npm install
npx playwright install chromium

# Task 11 write-safe affected suite
npm run e2e:ui:emulator

# Full write-safe application E2E suite
npm run e2e
```

The focused visual harness is test-only and does not initialize Firebase:

```bash
npm run test:ui-visual
```

## Fixtures and cleanup

- `e2e/firebase-fixtures.js` connects only to the guarded emulators.
- Fixture users and passwords are generated for one process and are not logged.
- Prefer fixed fixture data and observable state over private Vue/Pinia fields,
  random scores, or fixed sleeps.
- Each test must still clean up its own tournament in `finally`/`afterEach` so
  isolation does not depend solely on emulator shutdown.

Core helpers live in `e2e/helpers.js`. They drive public UI behavior; they must
not expose a reusable account or production configuration.
