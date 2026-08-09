# Application Architecture

This document owns the current high-level code map and dependency boundaries.
For persistence details use [Data model](./data-model.md) and
[Firebase](./firebase.md); for engineering rules use the
[code-quality index](./code-quality/README.md).

## Runtime stack

- Vue 3 application with Vue Router and Pinia
- Firebase Authentication, Realtime Database, and Cloud Messaging
- Vite build, Vitest unit/mounted coverage, and Playwright browser coverage
- Bulma plus shared semantic CSS variables and component-owned styles
- vue-i18n locale modules for English, Ukrainian, French, and Spanish

Exact versions and executable commands are owned by `package.json`.

## Ownership map

| Area                     | Owner                                          | Responsibility                                                           |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------ |
| Route/page state         | `src/views/`                                   | Route decoding, loading/error state, page composition                    |
| Feature UI               | `src/components/`                              | Interaction and feature-level orchestration                              |
| UI primitives            | `src/components/ui/`                           | Reusable markup, accessibility, and generic behavior                     |
| Domain/integration logic | `src/services/`                                | Pure rules, adapters, subscriptions, persistence runtimes, external APIs |
| Application state        | `src/stores/main.js`                           | Reactive façade and delegation to focused services                       |
| Tournament compatibility | `src/services/tournament-record.js`            | Envelope/legacy normalization and storage targets                        |
| Public live data         | `src/services/live-tournament.js`              | Public/TV loading profiles and subscription lifecycle                    |
| Public projection        | `src/services/public-tournament-projection.js` | V1 derivation, validation, atomic dual writes, and rollout fallback      |
| Presentation selectors   | `src/services/tournament-presentation.js`      | Shared phase, status, round, and metadata selectors                      |
| Design tokens            | `src/assets/css/variables.css`                 | Primitive and semantic colors shared by feature CSS                      |
| Localization             | `src/locales/`, `src/i18n.js`                  | User-facing strings and lazy locale modules                              |

Views and components may orchestrate services and store actions. Reusable
ranking, scoring, normalization, matching, and persistence logic belongs in a
service rather than a render path. Firebase access should pass through a
service/runtime boundary, not be duplicated in components.

## Data flows

### Authenticated editing

1. `src/main.js` mounts the application immediately, while `/` and routes with
   `meta.requiresAuth` wait for Firebase authentication in the navigation guard.
2. That private-route guard asks `useMainStore` to load owned/shared tournament
   references using the destination route's tournament query.
3. `tournament-record.js` normalizes either persisted record shape.
4. Components invoke façade actions.
5. `tournament-sync.js` writes the smallest owned Firebase paths and manages
   realtime subscriptions, echo suppression, debounce, and cleanup.

### Public and TV viewing

1. Direct public, TV, public-statistics, and custom-slug navigation mounts
   without waiting for authentication or loading private account data.
2. `tournament-ref.js` resolves a public reference or slug.
3. `live-tournament.js` subscribes to the V1 public projection and accepts only
   complete, supported, non-regressed revisions.
4. A valid projection is normalized through `tournament-record.js` and remains
   the only network source for Public/TV rendering.
5. During the migration window, an unavailable or invalid projection switches
   to the canonical bootstrap. A named public/TV profile attaches its required
   field listeners before the temporary parent listener is removed, preserving
   Firebase's local-cache handoff.
6. Shared presentation selectors feed page components and UI primitives.

Authenticated public-field mutations flow in the opposite direction:
components delegate to `tournament-sync.js` or an archive runtime, and the
projection service builds one root multi-path update for canonical and public
leaves. Private canonical mutations remain canonical-only. The same service
owns full publication, Group B path mapping, pre-rules permission fallback, and
canonical/projection deletion so no second filtering or revision policy exists.

### Archives and collaboration

`archive-collaboration.js` owns user-map loading, archive status, collaborator
operations, shared access watching, rollback, and lifecycle cleanup. Archive
index and backup records are handled by `archive-index.js`.

## Routes

| Path                     | Surface                                |
| ------------------------ | -------------------------------------- |
| `/`                      | Authenticated tournament management    |
| `/tournament`            | Public tournament by encoded reference |
| `/public/:slug`          | Public tournament by custom slug       |
| `/tv`                    | TV dashboard                           |
| `/stats`, `/stats/share` | Private and public statistics          |
| `/training`              | Training                               |
| `/archived`              | Archived tournaments                   |
| `/routes`                | Custom route management                |
| `/doc`, `/docs`          | Help/documentation surfaces            |
| `/show`                  | Legacy redirect to `/tournament`       |
| `/login-user`            | Legacy redirect to `/`                 |

`src/main.js` is authoritative for route guards, lazy locale loading, and new
routes.

## Update triggers

Update this document when a top-level owner, dependency direction, runtime data
flow, or route changes. Do not add inventories of every action or component;
link to the focused owner document instead.
