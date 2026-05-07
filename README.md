# Petanque Draw

Tournament organizer, game statistics tracker, and training tool for petanque.

**Live**: [https://andrewkameniev.github.io/petanque-draw/](https://andrewkameniev.github.io/petanque-draw/)

## What it does

- **Tournament Draw** — Swiss system, round-robin (groups), supermele, and playoff/knockout brackets. Automatic pairing algorithm, lane assignment, ranking with Buchholz coefficients.
- **Remote Viewing** — Shareable link + QR code for players to follow live draws and standings. Push notifications on updates.
- **Game Statistics** — Throw-by-throw stat tracking during games with simple and French scoring systems. Archive, tags, player analysis with charts.
- **Training** — Custom exercise builder for shooting practice with distance tracking and progress history.

## Tech Stack

Vue 3 | Vuex 4 | Vue Router 5 | Firebase (Auth, Realtime DB, FCM) | Bulma CSS | ApexCharts | Vite 8

## Setup

```bash
npm install
npm run dev      # Dev server at localhost:5173
npm run build    # Production build to dist/
npm run lint     # ESLint + Stylelint + Prettier check
npm run lint:fix # Auto-fix all linting/formatting issues
```

## Deployment

Deployed automatically to GitHub Pages via GitHub Actions on push to `develop`.

## Project Structure

```
src/
├── views/          # Route-level pages (Login, Public, Stats, Training)
├── components/     # UI components
│   ├── partials/   # Tournament management (Games, Ranking, PlayOff, etc.)
│   ├── stats/      # Statistics tracking components
│   └── training/   # Training exercise components
├── store.js        # Vuex state + Firebase sync
├── i18n.js         # vue-i18n instance (shared between app and store)
├── helpers.js      # Tournament logic (draw, ranking, sorting)
├── helpers-stat.js # Statistics calculations
├── firebase.js     # Firebase initialization
└── languages.js    # i18n translations (English + Ukrainian)
```

## Features

- Up to 10 simultaneous tournaments
- Import teams from Ukrainian Petanque Federation portal
- Swiss draw with backtracking algorithm (handles constraint violations)
- Playoff brackets up to 64 teams with cadrage support
- Offline team restore via localStorage
- PDF protocol export
- Bilingual (EN/UA)

## Documentation

See [docs/](./docs/README.md) for detailed architecture, domain, and feature documentation.
