# Firebase Boundaries

This document owns current database paths, access boundaries, and synchronization
architecture. Persisted tournament fields are documented in
[Data model](./data-model.md).

## Client services

- Firebase Authentication provides email/password identity.
- Realtime Database stores tournament, archive, statistics, training, route,
  collaboration, and notification-token data.
- Cloud Messaging delivers viewer notifications through the configured remote
  notification endpoint.

The web client identifiers in `src/firebase.js` are public Firebase client
configuration, not privileged server credentials. Do not replace or hide them
as secrets. User passwords, service-account material, and private API tokens
must never be tracked.

## Canonical paths

| Path                                            | Purpose                                              | Primary owner                                   |
| ----------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| `{uid}/tournaments/{id}`                        | Authoritative active and archived tournament records | `tournamentService`, store runtimes             |
| `users/{uid}/tournaments/{id}`                  | Per-user status, role, owner, and display metadata   | `userMapService`, archive/collaboration runtime |
| `{uid}/saved/{id}`                              | Legacy archive source read during migration          | archive/collaboration runtime                   |
| `archive/{id}`                                  | Queryable public archive metadata                    | `archiveIndexService`                           |
| `backups/{id}`                                  | Write-once archive backup payload                    | `archiveBackupService`                          |
| `{uid}/stats`, `{uid}/statPlayerIdentities`     | Statistics and normalized player identity            | statistics services                             |
| `{uid}/training`                                | Exercises, results, and TIR sessions                 | `trainingService`                               |
| `{uid}/arbiterRegistry`, `{uid}/arbiterPresets` | Protocol arbiter data                                | arbiter services                                |
| `customRoutes/{slug}`                           | Public slug routing                                  | `customRoutesService`                           |
| `tokens/{uid}/{id}`                             | Notification tokens for a tournament                 | tournament/notification flow                    |
| `emails`, `tournamentOrgs`                      | Account lookup and organizer authorization metadata  | auth/collaboration flows                        |

`src/services/db.js` owns ordinary path wrappers. `database.rules.json` is the
actual authorization boundary; UI visibility and Pinia roles are not security
controls.

## Tournament writes and subscriptions

`src/services/tournament-record.js` resolves whether competition data lives at
the legacy root, `groupB/`, `main/`, or `tournamentB/`. Callers must use that
storage target rather than reconstructing prefixes.

Authenticated editing passes through `src/services/tournament-sync.js`, which
owns granular path writes, match debouncing, subscription merge policies, echo
suppression, and disposal. Public and TV pages use the read-only profiles in
`src/services/live-tournament.js`.

When a user, tournament, or component lifecycle changes, listeners and pending
writes must be disposed before the next context becomes active. Permission
denial for shared data is handled as access revocation, not as an empty record.

## Archives

Archiving changes the user-map status while retaining the authoritative
tournament record. Eligible finished portal tournaments may also receive a
public `archive/` index entry and a write-once `backups/` payload. The old
`saved/` tree is a compatibility source, not the current archive destination.

## Test safety

The current Playwright suite can write to the remote project and is disabled
unless `E2E_ALLOW_REMOTE=1` and environment-injected test credentials are
present. See [e2e/README.md](../e2e/README.md). Missing safety configuration must
fail before browser or fixture writes; never add a live-project fallback.

## Update triggers

Update this document with changes to database paths, rules, record ownership,
subscription/write strategy, archive behavior, or remote-test policy. External
deployment, migration, and production data changes require separate explicit
authorization.
