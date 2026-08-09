# Main Store Architecture

`useMainStore` is the reactive application façade. Components may retain its
public getters and actions, while focused services own reusable domain and
runtime behavior.

## Stable public surface

The main state groups are:

- owned/shared tournaments and the active tournament ID;
- per-user tournament map and archived tournament collections;
- Firebase user and derived access roles;
- UI message state;
- short-lived active-match edit markers used by synchronization.

Important getters expose the current persisted record, normalized active Group
A/B competition, record-format detection, access role, and score-completion
state. `src/__tests__/main-store-characterization.spec.js` protects the façade
contract; search the store and that suite for the current action inventory
instead of copying it into documentation.

## Responsibility owners

| Owner                                   | Responsibility                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/services/tournament-record.js`     | Creation, format detection, normalization, metadata, Group A/B selection, storage targets |
| `src/services/round-timer.js`           | Pure timer transitions and final-round policy                                             |
| `src/services/tournament-sync.js`       | Granular writes, debounce, subscriptions, merge policy, echo suppression, cleanup         |
| `src/services/archive-collaboration.js` | Tournament loading, user maps, archives, collaborators, access watching, rollback         |
| `src/services/team-replacement.js`      | Validated team replacement across competition structures                                  |
| `src/stores/main.js`                    | Reactive assignment, editing orchestration, notifications, delegation                     |

Runtime services are created per store instance. Mutable timers, listeners, and
echo state must not become module-global singletons.

## Lifecycle invariants

- Changing the active tournament disposes old subscriptions, access watchers,
  pending debounces, and echo markers before selecting the next record.
- Logout or user switch performs the same cleanup before clearing state.
- Component unmount may call cleanup repeatedly; disposal remains idempotent.
- A delayed callback captures owner, tournament, user, and generation so it
  cannot write into a later selection.
- Shared permission loss removes only the local/shared reference and never
  deletes the owner's tournament.
- Archive and collaborator multi-path operations update local state only after
  required remote writes and attempt bounded rollback on partial failure.
- Record normalization stays pure; the store owns the explicit assignment into
  Pinia reactivity.

## Change workflow

Before changing the façade, map production consumers and add characterization
coverage for any unprotected public behavior. Extract pure logic first, retain a
compatibility delegate while consumers migrate, and remove it only after a
repository-wide search proves there are no callers. Update this document when
responsibility or lifecycle ownership changes, not for every new façade action.
