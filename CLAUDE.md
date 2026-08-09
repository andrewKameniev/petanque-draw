# Claude Entry Point

Follow the [repository agent contract](./AGENTS.md) and any closer scoped
`AGENTS.md`. For implementation work, open [docs/README.md](./docs/README.md),
then read only the documents routed for the affected area.

## Commands

```bash
npm run dev       # localhost:5173; strict port
npm run lint      # ESLint, Stylelint, and formatting
npm run test:run  # unit and mounted tests
npm run build     # production build
```

Use focused Vitest files while iterating, followed by the applicable full
checks required by `AGENTS.md`.

Before browser work, read [e2e/README.md](./e2e/README.md) and
[e2e/AGENTS.md](./e2e/AGENTS.md). The current Playwright suite can write to a
remote Firebase project and fails closed unless the documented opt-in and
environment-injected credentials are present. Never request, embed, or print
those values.

## Stable ownership anchors

- `src/stores/main.js` — Pinia façade
- `src/services/` — domain and integration boundaries
- `src/components/ui/` — reusable UI primitives
- `src/assets/css/variables.css` — shared design tokens
- `docs/systems/README.md` — tournament-rule index
