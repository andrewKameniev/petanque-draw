# Petanque Draw

Vue 3 + Vite tournament drawing application for petanque.

## Dev Server

```bash
npm run dev
```

Always runs on port 5173 (strictPort: true in vite.config.js).

## Testing

### Unit Tests (Vitest)

```bash
npm test           # watch mode
npm run test:run   # single run
```

### E2E Tests (Playwright)

**IMPORTANT:** Read `e2e/README.md` before running e2e tests. It contains:
- Test account credentials (do NOT ask the user for them)
- Helper functions API
- Cleanup requirements (every test must delete its tournament)

```bash
npm run e2e          # headless
npm run e2e:headed   # with browser
npm run e2e:ui       # interactive UI
```

**When using Playwright MCP (`playwright-cli` skill):**
- Base URL: `http://localhost:5173`
- Test account: see `e2e/README.md` for credentials
- Always use the `playwright-cli` skill, not raw bash commands

## Linting

```bash
npm run lint       # check all
npm run lint:fix   # fix all
```

## Project Structure

- `src/` — Vue application source
- `src/helpers.js` — Core logic (ranking, sorting, tournament algorithms)
- `src/components/partials/Protocol.vue` — Tournament protocol generation
- `src/views/Docs.vue` — Documentation page
- `e2e/` — Playwright e2e tests
- `docs/` — Internal developer documentation
