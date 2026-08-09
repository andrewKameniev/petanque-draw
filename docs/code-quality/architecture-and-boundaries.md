# Architecture and boundaries

Petanque Draw is a Vue 3 Options API application. Pinia is the application-facing state façade, Firebase Realtime Database is the persistence boundary, and domain behavior is owned by focused services.

## Dependency direction

```text
views / feature components
        │
        ├── render selectors and pure domain services
        └── dispatch Pinia actions or call an effect service
                         │
                    persistence adapters
                         │
                       Firebase

ui primitives ── props / emits / slots only
```

Dependencies point down this diagram. A service must not import a component. A UI primitive must not import Pinia, Firebase, or tournament-specific state.

## Current responsibility owners

Search these owners before creating another implementation.

| Responsibility                                                                    | Canonical owner                                                          |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Legacy/envelope tournament shapes, Group A/B selection, defaults, storage targets | `src/services/tournament-record.js`                                      |
| Public/archive/TV presentation selectors                                          | `src/services/tournament-presentation.js`                                |
| Group statistics and ranking                                                      | `src/services/group-ranking.js`                                          |
| Draw and lane algorithms                                                          | `src/services/draw.js`, `src/services/lanes.js`                          |
| Playoff bracket rules and transitions                                             | `src/services/playoff.js`, `src/services/results.js`                     |
| TIR scoring, ranking, and playoff rules                                           | `src/services/tir.js`                                                    |
| Timer state transitions and final-round policy                                    | `src/services/round-timer.js`                                            |
| Active-editor Firebase synchronization                                            | `src/services/tournament-sync.js` behind `src/stores/main.js`            |
| Read-only public/TV subscriptions                                                 | `src/services/live-tournament.js`                                        |
| Archive, collaboration, and archive index behavior                                | `src/services/archive-collaboration.js`, `src/services/archive-index.js` |
| Portal transport and player-field synchronization                                 | `src/services/portal.js`, `src/services/portal-sync.js`                  |
| Reactive application façade and UI notifications                                  | `src/stores/main.js`                                                     |
| Low-level Firebase CRUD adapters                                                  | `src/services/db.js`                                                     |

The owner list is a router, not a complete inventory. Update it when responsibility moves.

## Component boundary

Components may:

- hold ephemeral UI state;
- derive simple display state from props or service selectors;
- translate labels;
- emit user intent;
- dispatch a store action or invoke a narrow effect service.

New component code must not:

- import `firebase/*` or construct database paths;
- directly assign, delete, push, or splice persisted tournament state;
- implement ranking, draw, score, playoff, timer, migration, access, or normalization rules;
- detect legacy versus envelope record shapes outside `tournament-record.js`.

Some legacy components still cross these boundaries. Treat those sites as migration targets. Do not cite them as a pattern for new work.

## Store boundary

`src/stores/main.js` is a façade, not the home for every rule. Actions coordinate reactive state and delegate:

1. A pure service computes or validates the next state.
2. The store applies that result to Pinia state.
3. A synchronization service writes the exact persisted paths.
4. The action reports a stable success or error outcome to the component.

Keep runtime services instance-scoped. Subscriptions, timers, debounces, and browser listeners must return or expose deterministic cleanup. Cleanup is idempotent and runs on tournament switch, user switch/logout, and component teardown where applicable.

## Persistence and compatibility

- Preserve established Firebase paths unless a migration is explicitly in scope.
- Normalize old and new tournament shapes at the adapter boundary, then consume the canonical view.
- Do not retain mutable references supplied by callers when returning normalized or next-state data.
- Multi-path operations define ordering and rollback behavior before writes start.
- Client-side visibility checks improve UX but never replace Firebase security rules.
- Access behavior changes require service tests and rules review together.

## Measurable boundary gate

For new and changed code:

- zero new direct Firebase imports in `src/components/` or `src/views/`;
- zero new direct persisted tournament mutations in components;
- zero new legacy/envelope shape detection outside the canonical adapter;
- every new listener, debounce, or timer has an idempotent disposal test;
- every new persistence path is covered by a service test using an injected adapter;
- a new architectural owner requires an update to this document.

When a narrow fix must touch a legacy boundary, isolate the addition, cover it, and record the deferred extraction in the task rather than broadening the refactor silently.
