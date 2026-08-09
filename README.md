# Petanque Draw

Tournament organization, live results, statistics, and training tools for
petanque.

**Live:** <https://andrewkameniev.github.io/petanque-draw/>

## Capabilities

- Swiss, groups, barrage, supermele, TIR, cadrage, and playoff formats
- Shareable public and TV views with realtime results
- Tournament archives, protocols, portal integration, and collaboration
- Throw-by-throw statistics and shooting-practice sessions
- English, Ukrainian, French, and Spanish interfaces

## Stack

Vue 3, Pinia, Vue Router, Firebase Auth and Realtime Database, Vite, Vitest,
Playwright, Bulma, and semantic CSS custom properties. Exact dependency
versions are owned by `package.json` and `package-lock.json`.

## Local development

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
```

The development server uses `http://localhost:5173` with a strict port. Browser
tests can write remote Firebase data and therefore require a separate explicit
opt-in; read [e2e/README.md](./e2e/README.md) first.

## Code map

```text
src/
├── views/          route-level pages and public surfaces
├── components/     feature components and reusable UI primitives
├── services/       domain logic, adapters, Firebase runtimes, and integrations
├── stores/main.js  Pinia application façade
├── locales/        localized application strings
├── assets/css/     shared styles, themes, and design tokens
├── helpers.js      legacy-compatible tournament helpers
└── firebase.js     Firebase client initialization
```

Start with [docs/README.md](./docs/README.md) for an index that routes each kind
of change to only the relevant documentation. Coding agents must also follow
`AGENTS.md` and the closest scoped `AGENTS.md`.

## Deployment

Pushes to `develop` are built and deployed to GitHub Pages by
`.github/workflows/deploy.yml`. Repository changes do not authorize a deploy,
Firebase migration, or other external mutation.
