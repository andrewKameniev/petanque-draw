# Petanque Draw — Claude Notes

@RTK.md

The shared engineering and safety contract in `RTK.md` is mandatory. These are
Claude-specific project commands and tool notes only.

## Project

Vue 3 + Vite tournament drawing application for petanque. The development
server uses port 5173 with `strictPort: true`.

```bash
npm run dev
npm run build
npm run lint
npm run test:run
npm run test:ui-primitives
npm run test:ui-visual
```

## Browser tests

Read `e2e/README.md` first. Write-capable E2E is emulator-only and must be
started through the documented npm wrapper; direct Playwright invocation is
intentionally fail-closed.

```bash
npm run e2e:ui:emulator
```

For interactive browser tooling, use the available Playwright/browser skill and
the base URL printed by the test runner. Do not recover test state through Vue
or Pinia private runtime fields.

## Project structure

- `src/` — Vue application source
- `src/helpers.js` — ranking, sorting, and tournament algorithms
- `src/components/partials/Protocol.vue` — tournament protocol generation
- `e2e/` — Playwright suites and emulator fixtures
- `docs/` — internal developer documentation
