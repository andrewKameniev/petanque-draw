# Task 10: Harden Archive Durability, Integrity, and Access Control

## Goal

Make archived tournaments production-grade: secure against forged client writes, correct for every owner/collaborator context, durable outside RTDB, recoverable through tested tooling, safe to migrate, and fully observable.

The archive may be described as **10/10** only when every acceptance gate and the final scorecard in this task is satisfied with recorded evidence.

This task supersedes the incomplete implementation portions of `docs/archive-tasks.md`. Update that document and `docs/archive-analysis.md` to describe the architecture that is actually shipped.

> **Live-system safety:** this task authorizes repository changes and local/emulator validation only. It does not authorize enabling billing, creating or retention-locking a production bucket, deploying Firebase rules/functions, changing custom claims, migrating live records, or running destructive production tests. Obtain explicit approval for each external operation and record its result.

## Problem

The current archive implementation has correctness, security, and recoverability gaps:

- Browser clients can create global archive and backup records without trusted ownership or schema validation.
- The global key is only `tournamentId`, so two owners can collide and a known ID can be preempted.
- Archive index and backup failures are swallowed after the tournament is already shown as archived.
- The current backup is another node in the same RTDB/project, not an independent recovery copy.
- Super-admin reads and actions can use the logged-in admin's UID instead of the indexed owner UID.
- Delete, unarchive, map propagation, index updates, and source removal are not one recoverable operation.
- Portal permanence is enforced only by client logic/index metadata, not at the source-data boundary.
- Re-archiving can retain a stale first snapshot rather than create a new immutable revision.
- Archived metadata can drift after rename, portal-ID, or media changes.
- There is no verified restore workflow, reconciler, reproducible legacy backfill, or deployment gate.
- Critical rules, cross-owner UI, backup-failure, restore, and migration behavior has no deterministic coverage.
- The list does not yet satisfy the documented virtualization, caching, and large-dataset requirements.

## Required Product and Architecture Decisions

Use these defaults unless the product owner explicitly approves a different decision in the implementation PR:

| Decision                       | Required default                                                                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archive identity               | Composite `{ ownerUid, tournamentId, revision }`; never `tournamentId` alone                                                                                                      |
| Current archive versus history | A current-index entry represents a currently archived tournament; an immutable revision ledger preserves permanent history                                                        |
| Global archive authority       | Owner only; super admin may override with an audited reason. Admin/scorer collaborators may hide from their own list but may not globally archive/delete/unarchive                |
| Super-admin authority          | Firebase custom claim such as `archiveAdmin: true`; no hard-coded email authorization                                                                                             |
| Archived source mutation       | Read-only while archived. Rename/portal/media corrections require unarchive and a new archive revision, or a privileged correction operation that creates a new verified revision |
| Successful archive RPO         | Zero: an acknowledged archive must already have a verified durable backup                                                                                                         |
| Restore target                 | A single tournament can be verified and restored in staging in 30 minutes or less                                                                                                 |
| Backup failure domain          | Dedicated Cloud Storage bucket in a separately administered project/account or an explicitly approved equivalent independent failure domain                                       |
| Backup history                 | Immutable revision objects; source deletion never deletes backup history                                                                                                          |
| Portal records                 | Application-enforced non-deletable; every supported deletion path rejects them and independently retained backup history can reconstruct source/index state                       |
| Non-portal retention           | At least the approved retention period; default 365 days. Destructive expiration requires a separate reviewed policy                                                              |

Before implementation, record the selected bucket/project, region, retention policy, recovery targets, billing implications, IAM owners, and who may authorize a restore. Do not apply a retention lock until its irreversible impact is approved.

Because tournament backups contain player and collaborator data, record a data-classification/privacy review as part of the retention decision. Define the lawful deletion/redaction exception process before describing any record as permanently retained; do not let a product label such as “portal tournament” silently override applicable privacy obligations.

### Threat model and guarantee boundary

The design must defend against unauthenticated clients, malicious or buggy authenticated clients, collaborators using another owner's ID, stale/cached application versions, duplicate/concurrent requests, partial service failures, application regressions, ordinary RTDB loss, and compromise of the primary application project.

Do not promise literal permanence against a privileged administrator of the separately administered backup account, compromise of every administrative credential, a provider-wide catastrophic loss, or a legally required deletion. The product guarantee is application-enforced non-deletion plus reconstruction from independently retained and access-controlled backup history. Record residual risks, credential controls, and break-glass authority explicitly.

## Security and Durability Invariants

These invariants are non-negotiable:

1. A browser cannot create, overwrite, or delete archive index, history, operation, lock, or backup records directly.
2. A client may send `ownerUid` only as an untrusted selector for a super-admin action. Server code verifies it against trusted index/map/source data and authorization; it never trusts the selector or resolves ownership from `tournamentId` alone.
3. Archive identity is owner-scoped and cannot collide across users.
4. The UI cannot report success or move the tournament to its completed archived state until a backup has been uploaded and verified.
5. Every completed current-index entry points to a verified immutable backup revision with a SHA-256 checksum and object generation.
6. A successful retry is idempotent; duplicate clicks never create conflicting current state.
7. If Storage succeeds but RTDB commit fails, the object is retained and a retry/reconciler can safely finish the operation.
8. Source, index, collaborator maps, and lifecycle state cannot be left partially committed by a normal failure.
9. Portal-backed source data cannot be deleted through UI, direct client SDK access, callable functions, migration, or normal admin scripts. Break-glass/legal actions are separately authorized, audited, and outside ordinary application flows.
10. Unarchive removes the current-index entry but never erases history. Re-archive creates a new revision.
11. Deleting an allowed non-portal tournament removes source/current index/all relevant maps atomically, writes a tombstone, and preserves backup history.
12. A backup is not acknowledged until upload integrity plus deterministic parse, schema, and reconstruction validation pass. Periodic staging restore drills separately prove end-to-end operational recoverability.
13. All privileged actions are authenticated, authorized, idempotent, and logged with an operation ID.
14. No secret, service-account key, access token, full tournament payload, or unnecessary player PII appears in the repository or application logs.

## Target Data Model

Use a versioned owner-scoped schema. Exact names may change, but the semantics may not.

```text
archiveIndexV2/{ownerUid}/{tournamentId}
archiveHistoryV2/{ownerUid}/{tournamentId}/{revision}
archiveOperationsV2/{operationId}
archiveLocksV2/{ownerUid}/{tournamentId}
```

The current index should contain only metadata needed for list rendering and verified backup discovery:

```js
{
  schemaVersion: 2,
  ownerUid,
  tournamentId,
  currentRevision,
  name,
  nameLower,
  date,
  system,
  teamsCount,
  roundsPlayed,
  portalId: null,
  tournamentIsFinished: true,
  archivedAt,
  archivedByUid,
  sourceSha256,
  backup: {
    status: 'verified',
    retentionClass: 'portal', // or 'standard'
    bucket,
    objectPath,
    generation,
    sourceSha256,
    objectSha256,
    semanticSha256,
    bytes,
    verifiedAt,
    recordSchemaVersion,
    appVersion,
  },
}
```

Each history revision is immutable and records the same backup manifest plus lifecycle/audit metadata. An unarchive or allowed delete appends an event/tombstone instead of altering earlier revisions.

Transient states belong in `archiveOperationsV2`, and the server-owned `archiveLocksV2` path provides a rule-addressable lease for the affected source/map record. They do not belong in a supposedly completed index entry:

```text
requested -> backup_pending -> backup_verified -> commit_pending -> completed
                                              \-> failed/retryable
```

Operation records must have bounded retention and must not contain the full tournament payload.

Cloud Storage objects must be owner- and revision-scoped, for example:

```text
archive-backups/v2/{retentionClass}/{ownerUid}/{tournamentId}/{revision}.json
```

Use separate buckets or enforceably separate `portal` and `standard` retention prefixes. Lifecycle expiration must be unable to match portal objects; prove that configuration in tests and deployment evidence. Never overwrite an earlier revision. Use a create-only generation precondition and save the retention class, checksum, size, schema version, application version, and content type as object metadata.

The portable backup object may wrap the raw tournament with a versioned manifest, but its `tournament` payload must be the unmodified logical source snapshot. Record separate hashes for the canonical source payload and complete stored object; a normalized semantic hash is additional evidence, not a replacement for either integrity check.

## Relevant Files

Current files likely to change:

- `src/services/archive-index.js`
- `src/services/archive-collaboration.js`
- `src/services/tournament-record.js`
- `src/services/db.js`
- `src/stores/main.js`
- `src/views/Archived.vue`
- `database.rules.json`
- `firebase.json`
- `.github/workflows/deploy.yml`
- `package.json`
- `docs/archive-analysis.md`
- `docs/archive-tasks.md`
- `docs/tournament-lifecycle.md`
- `e2e/README.md`

Expected new areas:

- `functions/` for authenticated archive lifecycle functions and reconciliation
- `storage.rules`
- `scripts/archive-admin.mjs` or an equivalent Admin SDK CLI
- `scripts/README.md`
- Firebase Emulator configuration and rule/function integration tests
- `e2e/archive-hardening.spec.js`
- Archive-specific unit, component, migration, restore, and security tests
- A staging/production archive runbook

Do not add a service-account JSON file or hard-code project IDs/secrets.

## Required Changes

### 0. Contain the current V1 path

Do not leave the known client-write and false-success path exposed while V2 is being built.

- Add a runtime feature flag for new V1 archive/index/RTDB-backup writes; its default value is `false` so V1 writes are disabled whenever V2 is not ready.
- Enforce containment in database rules as well as UI: stale clients must be unable to change a V1 user-map status from active to archived or create V1 index/backup artifacts directly.
- Define a minimum supported archive-client/schema version. Make stale PWA clients fail safely with an update/read-only message, invalidate obsolete service-worker assets through the normal release mechanism, and test an old-client request against new rules.
- Keep already archived tournaments readable; do not delete or rewrite V1 data as containment.
- If product continuity requires temporary V1 archive writes, first deploy narrowly validated rules that bind `ownerUid` to the authenticated source owner, reject arbitrary IDs/schema, prohibit backup overwrite/delete, and prevent portal-source deletion. Treat this only as a short-lived compatibility bridge.
- Make the V1 UI report archive durability as unavailable rather than claiming a verified backup.
- Add emulator abuse tests for the temporary rules and an expiry/removal checkpoint for all compatibility code.

Production flag/rule changes still require explicit approval. If approval is not available, prepare and test containment locally and call out the continuing production risk.

### 1. Freeze and document the lifecycle contract

Document the exact state transitions and role policy before changing production code:

- Active -> archived
- Archived -> active
- Archived non-portal -> deleted with retained history/backup
- Active/archived portal -> deletion rejected
- Archived -> metadata correction -> new verified revision
- Archive retry after each possible failure
- Re-archive after unarchive and modification
- Owner, admin collaborator, scorer/viewer, unrelated user, and super-admin behavior

Define whether existing collaborator map statuses are global lifecycle state or per-user visibility. Implement separate commands for global lifecycle and personal hide/unhide; do not overload one action with both meanings.

### 2. Move archive lifecycle operations to trusted server code

Create authenticated server operations for at least:

- Archive tournament
- Unarchive tournament
- Delete archived non-portal tournament
- Retry/reconcile a failed archive
- Super-admin metadata correction, if the product retains this capability

For every request:

1. Verify authentication and the required role/custom claim.
2. Resolve `{ ownerUid, tournamentId }` from trusted map/source data.
3. Acquire a server-owned lifecycle lock with bounded expiry; database rules deny client source/map mutation while the lock is active.
4. Read an exact logical source snapshot, preserving unknown fields, and validate existence, canonical/legacy shape, finished state, portal status, and `main.preferences.isTestTournament`.
5. Canonically serialize and hash the unmodified logical snapshot for recovery. Separately normalize a deep clone through the tournament adapter for semantic validation and index metadata.
6. Run deterministic parse/schema/reconstruction validation and compute raw-content and, where useful, semantic hashes plus the idempotency fingerprint.
7. Upload and verify the immutable backup revision.
8. Re-read the source and abort unless its source version/raw hash still exactly matches the captured snapshot. A stale/expired lock is never sufficient evidence by itself.
9. Atomically commit the current index, history manifest, owner/collaborator map statuses, completed operation state, and lock removal in one RTDB multi-location update.
10. Return success only after the final commit.

The server must accept repeated delivery and concurrent clicks safely. A retry for the same source fingerprint returns the existing completed revision; a changed source creates a new revision. The reconciler may clear an expired lock only after inspecting the operation, source hash, and any uploaded object; it must never silently commit a stale snapshot.

Require App Check or the approved equivalent on public callable endpoints, enforce per-user operation rate/size limits, and alert on repeated abuse. Privileged super-admin delete/correction/restore operations must require a recent authenticated session or approved step-up control in addition to the custom claim.

### 3. Implement independent immutable backups

Provision the approved bucket and IAM outside application-client control:

- Separate least-privilege archive-writer and restore-reader identities; the normal writer cannot delete/list broadly, and restore access is not granted to the browser runtime
- No browser SDK access to the backup prefix
- Uniform bucket-level access
- Object versioning where supported by the approved design
- Retention policy and, only after approval, retention lock
- Lifecycle policy that does not violate portal/non-portal retention decisions
- Encryption and audit logging appropriate to the selected project
- Region/failure-domain choice documented against RTDB location

The archive operation must:

- Serialize the exact logical source snapshot without normalization or field dropping, including unknown fields, Group B, TIR, playoffs, collaborators, preferences, and root metadata
- Build a separate normalized projection for schema/semantic validation and list metadata; do not substitute that projection for the recovery payload
- Include an explicit backup format/schema version
- Upload with create-only semantics
- Verify object generation, byte count, stored-object SHA-256, embedded raw-source SHA-256, parse/schema reconstruction, and retention class before final RTDB commit
- Treat a mismatched existing object as a hard conflict, never as success
- Avoid logging the serialized tournament

Add a scheduled reconciler that reports and safely handles:

- Pending operations older than the agreed SLA
- Verified objects without a committed index/history manifest
- Index/history manifests with missing objects
- Checksum or generation mismatches
- Archived user maps without an index
- Index entries without source data
- Portal/index/source metadata disagreement

Only clearly safe repairs may be automatic. Destructive or ambiguous cases must be reported for review.

### 4. Make lifecycle changes atomic and recoverable

Use an explicit saga for the unavoidable Storage/RTDB boundary and atomic multi-location updates inside RTDB.

Required failure behavior:

- Backup upload fails: source/maps/current index stay active and the UI receives a visible retryable error.
- Source changes or the lifecycle lock expires before commit: abort, retain/report any uploaded orphan revision, and require a fresh operation against the new source hash.
- Backup verifies but RTDB commit fails: retain the object, mark the operation retryable, and let retry/reconciliation finish the same revision.
- One collaborator path is invalid: reject before commit or fail the entire atomic update; never partially propagate status.
- Duplicate archive request: return the existing operation/result.
- Archive races with unarchive/delete: transaction/version check admits exactly one legal transition.
- Delete succeeds: source, current index, and every relevant map are removed together; backup/history remain.
- Unarchive succeeds: relevant maps become active and the current index is removed together; backup/history remain.

Do not catch and ignore an index, backup, source, map, history, or audit failure. Every failure must be returned as a typed user-visible error and structured server log.

### 5. Harden RTDB, Storage, and authorization rules

Replace the hard-coded email check with a custom claim and deny all browser writes to server-owned archive paths.

Rules must enforce:

- Unauthenticated users cannot read private archive/index/history data.
- Owners may read their own current-index metadata through their owner-scoped path.
- Only `archiveAdmin` may list all owners' current indexes.
- Owners may read their own history manifests only if the product contract requires it; raw backup objects are retrieved only through an audited, short-lived authorized server flow or the Admin CLI.
- Browser writes to V2 index/history/operations/locks and backup Storage prefixes are denied.
- Archived source records cannot be modified directly while a current V2 index exists.
- Portal-backed source records cannot be deleted even if a client bypasses the UI.
- Active non-portal source writes preserve current owner/admin compatibility.
- Legacy flat `archive` and RTDB `backups` paths are frozen during migration and removed or permanently denied only after rollback criteria are met.
- Payload type/length validation remains on any client-writable map or source metadata.

Use Firebase Emulator Suite and `@firebase/rules-unit-testing`. Cover unauthenticated, owner, admin collaborator, scorer/viewer, unrelated authenticated user, revoked user, and custom-claim super-admin contexts.

### 6. Repair owner identity throughout the UI and store

Introduce one explicit archive reference shape:

```js
{
  (ownerUid, tournamentId, revision);
}
```

Use it for:

- List keys and selection
- Lazy fetch and live subscription
- Cache keys
- Public-link generation
- Rename/metadata correction
- Media refresh
- Delete, hide, unarchive, and retry operations
- Loading/error state and stale-response cancellation

Never derive a foreign archive's owner from the logged-in user or only from `userTournamentMap`.

Additional UI requirements:

- A stale request/subscription cannot overwrite a newer selection.
- Failures are visible and actionable; no unconditional success toast.
- Buttons reflect server policy but are not treated as the security boundary.
- Pending operations disable duplicate destructive actions.
- Portal permanence and retained-backup behavior are explained in confirmations.
- Search is normalized and debounced.
- The list shows name, date, system, and teams count.
- A list of at least 5,000 synthetic entries keeps a bounded DOM through virtualization.
- Loaded records are cached by composite identity and invalidated after lifecycle changes.
- Keyboard navigation, visible focus, loading status, and error announcements are accessible.

### 7. Eliminate metadata drift

Create one server-side metadata builder using the canonical adapter. It must handle:

- Current envelope records
- Legacy root records
- Group B without inheriting Group A results
- TIR participants
- Missing games/date with documented fallbacks
- String/numeric portal IDs
- Nested `main.preferences.isTestTournament`
- Invalid or partial records with typed errors

Archived sources are immutable by default. If privileged archived metadata correction remains supported, the operation must create and verify a new backup revision and atomically update the current index; it must not mutate only one copy.

### 8. Add restore, verification, and audit tooling

Create an Admin SDK CLI or equivalent trusted tool with these commands:

- `list` and `inspect`
- `audit`/`reconcile --dry-run`
- `verify` checksum, generation, schema, and source/index consistency
- `restore --dry-run`
- `restore` to a new tournament ID by default
- Explicit guarded overwrite mode
- Migration/backfill with checkpoint/resume

Restore must:

1. Require a specific owner, tournament, and revision.
2. Download and verify checksum/generation before parsing.
3. Validate the backup schema and normalize legacy/current record shapes.
4. Refuse a target collision by default.
5. Default to a new active tournament ID while retaining provenance to the restored archive revision. An explicit `--state archived` mode may recreate a current-index entry that points to the already verified revision.
6. Recreate source and the selected map/index state atomically.
7. Emit an audit record without logging the full tournament.
8. Verify the restored record through a read-back hash and application rendering smoke test.

Credentials come from approved environment/application-default credentials. Dry-run is the default for destructive or production-targeting commands.

### 9. Backfill and reconcile every legacy archive

The migration must discover:

- Archived entries in all user tournament maps
- Current `tournaments/` records
- Legacy `saved/` snapshots, if still present
- Existing flat `archive/{tid}` entries
- Existing RTDB `backups/{tid}` entries

It must support:

- Dry-run with zero writes
- Checkpoint/resume
- Bounded concurrency and retries
- Idempotent re-execution
- Two owners with the same tournament ID
- Missing source/orphan map entries
- Conflicting owner/index metadata
- Existing V2 revision with matching or mismatching hash
- Test-tournament exclusion
- Machine-readable and human-readable reports

For each valid record, upload and verify the independent backup before atomically creating V2 history/current index state. Never mark a migration item complete based only on the old RTDB backup.

Before production migration, take the approved pre-migration backup and run a read-only audit. After migration, reconcile these counts:

- Archived owner-map records
- Valid source records
- V2 current-index entries
- V2 immutable history revisions
- Verified Storage objects
- Skipped, malformed, orphaned, conflicting, and failed records

Zero unexplained mismatches is required. Preserve V1 data read-only until the rollback window closes and restore drills pass.

### 10. Add observability and operational controls

Emit structured logs and metrics for:

- Archive/unarchive/delete/restore outcome and latency
- Authorization rejection
- Backup upload and verification failure
- RTDB commit failure after successful upload
- Pending operations beyond SLA
- Reconciliation mismatches
- Restore verification failure
- Migration progress and unresolved records

Use operation IDs and non-sensitive identifiers. Add alerts for completed archive without a verifiable object, repeated operation failures, reconciliation drift, and restore failures.

Create a runbook covering:

- Ownership of alerts and credentials
- Retry/reconciliation steps
- Single-record and bulk restore
- Checksum mismatch escalation
- Portal permanence policy
- Migration rollback
- Bucket retention and recovery targets
- How to prove deployed rules/functions/bucket configuration match the reviewed version

### 11. Make deployment reproducible and gated

Add staging and production Firebase/GCP configuration without committing secrets.

CI must gate every archive change on:

- Lint and formatting
- Full unit suite
- Archive unit/component suite
- RTDB and Storage rules emulator suite
- Function integration and failure-injection suite
- Migration dry-run fixtures
- Emulator-backed archive Playwright suite
- Production build

Deployment order:

1. Approved bucket/IAM/retention configuration
2. Server functions and V2 schema support
3. RTDB and Storage rules
4. Restore/reconciliation tooling and staging drill
5. Frontend behind a disabled-by-default feature flag
6. Staging migration and full canary
7. Approved production backend/rules deployment
8. Approved production read-only audit and migration
9. Frontend enablement
10. Monitored production archive and restore drill

Production deployment must use an environment approval and post-deploy checks. The current Pages workflow must not publish an archive-dependent frontend merely because `npm run build` succeeds.

## Affected Area and Required Regression Coverage

| Affected behavior                       | Existing coverage to retain            | Required coverage/addition                                                                          |
| --------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Existing owner archive/unarchive flow   | Store/lifecycle characterization tests | Exact success state plus failure injection at every Storage/RTDB boundary                           |
| Owner identity and cross-user selection | Partial `Archived.vue` behavior        | Super admin with no collaborator map reads/subscribes/links/actions against indexed owner           |
| Authorization                           | Mostly client/UI checks                | Emulator rules and function tests for every role and direct-bypass attempt                          |
| Portal permanence                       | Button/service checks                  | Direct source/index/function/script delete denial and retained backup assertion                     |
| Backup creation                         | No durable Storage coverage            | Immutable object, checksum, generation, metadata, independent failure-domain, and retry tests       |
| Re-archive                              | No reliable coverage                   | New revision after modification; previous revision remains restorable                               |
| Delete/hide/unarchive                   | Partial service tests                  | Atomic all-map behavior, tombstone/history retention, collaborator hide-only behavior               |
| Canonical and legacy shapes             | Tournament adapter tests               | Exact archive/restore fixtures for envelope, legacy root, Group B, and TIR                          |
| Metadata consistency                    | No archive-focused suite               | Frozen-clock exact schemas, date fallbacks, portal/test flags, no input mutation                    |
| Migration/backfill                      | No reproducible script                 | Dry-run, idempotency, collision, resume, orphan/conflict, count reconciliation                      |
| Restore                                 | None                                   | Checksum/schema/target-collision/failure/rollback and rendered staging restore                      |
| Archive list UX                         | Layout smoke only                      | Exact ordering/filtering, composite selection, stale-response safety, virtualization, accessibility |
| Deployment/operations                   | Build-only Pages workflow              | CI gates, rules/functions deployment evidence, alerts, runbook, staging canary                      |

### Baseline-before-remediation rule

Before production changes:

1. Map every coverage row to a current test or an explicit gap.
2. Add passing characterization tests for behavior that must remain compatible.
3. Add target regression/security tests for confirmed defects and record that they fail on current `develop`; do not encode a vulnerability as desired behavior merely to make a baseline pass.
4. Record exact focused commands and results in the PR/task summary.
5. Use deterministic fixtures, fixed clocks, injected failures, and emulator paths.
6. Run the identical compatibility matrix after each implementation phase.

## Required Test Matrix

### Unit and component tests

Cover at minimum:

- Exact V2 metadata for envelope, legacy, Group B, TIR, missing date, portal/non-portal, and nested test preferences
- Deterministic serialization, checksum, revision, and idempotency keys
- Full role x lifecycle x portal permission matrix
- No input mutation
- Archive state machine and illegal transitions
- Typed error mapping; no false success
- Cross-owner cache/reference behavior
- Stale lazy-load/subscription response protection
- Search/filter/sort and localStorage toggle
- Virtualized DOM bounds and keyboard/focus behavior

### Firebase Rules and function integration tests

Run against Auth, RTDB, Functions, and Storage emulators or an isolated ephemeral project.

Include:

- Unauthenticated and arbitrary authenticated read/write attempts
- Forged owner UID and known-ID preemption
- Two owners with the same tournament ID
- Hard-coded-email account without the custom claim
- Owner, admin collaborator, scorer/viewer, unrelated user, revoked user, and claimed super admin
- Malformed/oversized payloads
- Direct V2 index/history/operation/lock/Storage write and delete attempts
- Direct archived-source edit/delete
- Direct portal-source deletion in active and archived states
- Source mutation during upload, expired lifecycle lock, and final source-hash mismatch
- Archive upload failure
- Object verification/checksum failure
- RTDB failure after verified upload
- Collaborator-map failure
- Duplicate request and concurrent archive/unarchive/delete
- Reconciler recovery of safe orphan/pending cases

### Migration, verification, and restore tests

Use isolated fixture datasets containing:

- Current envelope, legacy root, Group B, and TIR records
- Legacy `saved/` snapshot
- Orphan map, missing source, malformed source, duplicate ID across owners, conflicting old index, and old RTDB backup
- Existing matching and mismatching V2 revisions
- Interrupted migration checkpoint and retry

Assert dry-run zero writes, deterministic reports, idempotent second run, exact reconciliation counts, verified checksums, collision refusal, and safe restore to a new ID.

### E2E tests

The full archive lifecycle suite must run against Firebase emulators or an ephemeral project, never the shared Firebase account.

Cover:

1. Owner finishes and archives envelope, legacy-compatible, and TIR tournaments.
2. UI does not show success until the backup is verified.
3. Injected backup failure leaves the tournament active and shows a retryable error.
4. Reload shows the exact archived record and metadata.
5. Super admin with no collaborator relationship lists and opens another owner's record.
6. Correct owner is used for subscription, public link, retry, and every action.
7. Collaborator hide affects only their list.
8. Owner unarchive preserves history and creates a new revision after later re-archive.
9. Owner/super-admin non-portal delete removes source/current index/maps but backup/history survives.
10. Portal delete is rejected through UI and direct backend calls with no changed paths.
11. Search, system filter, show-all persistence, date order, loading/missing/denied states, and stale selection races.
12. Keyboard navigation, visible focus, and accessible loading/error announcements.
13. At least 5,000 synthetic index entries retain a bounded rendered DOM and responsive filtering.

Use exact path polling and exact item IDs/order. Do not use arbitrary sleeps or row-count-only assertions.

The existing shared Firebase account may run only a narrow, reversible, serial read/layout smoke using uniquely tagged fixtures. It must not invoke the real Archive action or create write-once backup/index data. Record a pre/post path manifest and fail cleanup if any test-owned path remains.

### Operational staging drill

Before production enablement:

1. Archive a uniquely tagged staging tournament through the deployed UI.
2. Record source hash, index manifest, object generation, object hash, and timestamps.
3. Verify access-denial probes for unrelated users and direct client writes.
4. Delete an allowed non-portal source through the server operation and prove backup/history survives.
5. Restore the selected revision to a new ID.
6. Prove the restored hash/schema and rendered application behavior match the source.
7. Run the same verification for at least one legacy record and one TIR/Group B record.
8. Remove canary artifacts only through the documented admin cleanup path, without deleting retained backup evidence contrary to policy.

## Compatibility Constraints

- Preserve current public tournament references based on `{ ownerUid, tournamentId }`.
- Support current envelope and legacy root records throughout migration and restore.
- Preserve Group B, TIR, playoffs, cadrage, collaborators, streams, and root metadata in backups.
- Preserve regular-user archive viewing while V2 rolls out.
- Do not silently change owner/admin/scorer permissions; document the selected global-versus-personal archive policy.
- Do not delete or rewrite V1 records until migration reconciliation, rollback window, and restore drills are complete.
- Do not introduce a live portal dependency into deterministic tests.

## Non-Goals

- Building a historical statistics dashboard
- Redesigning tournament result presentation
- General Firebase data-model migration outside archive needs
- Deleting old backups as part of this task
- Making archived tournament content editable in place
- Deploying or migrating production without explicit approval

## Rollout and Rollback

Use a staged, reversible rollout:

1. Prepare, test, and—after approval—enable the V1 containment flag/rules so unsafe new V1 writes stop.
2. Add V2 backend/schema and tests with the V2 frontend flag off.
3. Deploy and verify in staging.
4. Add frontend dual-read support; all new writes use server V2 operations.
5. Run staging migration and restore drills.
6. Deploy production backend/rules only after approval.
7. Run production read-only audit, then approved idempotent migration.
8. Enable V2 for a canary cohort, monitor, then expand.
9. Keep V1 read-only for at least one full release cycle and until two successful restore drills complete.

Rollback must never re-enable unsafe V1 writes. Roll back to the last compatible V2 frontend while keeping reviewed V2 backend/rules in place, or enter an explicit read-only degraded mode in which archive lifecycle operations are temporarily unavailable. Define cached/PWA client behavior and the minimum supported client version. Do not delete V2 index/history/backups; stop new migration batches and leave completed operations restorable. Migration checkpoints and server operations must be safe to resume after rollback.

## Verification Commands

Add stable package scripts, then run the equivalent of:

```bash
npm run lint
npm run test:run
npm run test:archive
npm run test:archive:emulator
firebase emulators:exec --only auth,database,functions,storage "npx playwright test e2e/archive-hardening.spec.js --workers=1"
npm run build
```

Also record:

- Migration dry-run and reconciliation report
- Rules abuse-test matrix
- Function failure-injection report
- Bucket IAM/versioning/retention configuration evidence
- Deployed rules/function versions
- Staging archive/delete/restore drill with sanitized hashes and timestamps
- Production read-only audit before any migration

## Acceptance Criteria

- Browser clients cannot write archive index, history, operations, locks, or backups.
- No hard-coded email controls archive administration.
- Composite owner-scoped identity prevents cross-owner collisions.
- Server operations enforce owner/super-admin/global lifecycle and collaborator hide-only policy.
- Archive success is impossible before an immutable backup is uploaded and checksum-verified.
- No injected failure produces a false success or partial completed archive.
- Duplicate and concurrent requests are idempotent and deterministic.
- Portal source deletion is rejected through every tested path.
- A lifecycle lock and final source-version/raw-hash comparison prevent acknowledging a stale backup.
- Backup payloads preserve the unmodified logical source, while normalized projections are used only for validation/metadata.
- Portal and standard retention classes are enforceably separated and lifecycle expiration cannot select portal objects.
- Delete/unarchive/map/index transitions are atomic inside RTDB and recoverable across Storage/RTDB.
- Re-archive creates a new immutable revision; earlier revisions remain verifiable/restorable.
- Super-admin cross-owner list, selection, subscription, links, and actions use the indexed owner.
- Index metadata cannot drift silently from the archived source/revision.
- Restore tooling verifies checksum/schema and completes the staging drills within the agreed RTO.
- Migration is dry-run-first, resumable, idempotent, and ends with zero unexplained reconciliation mismatches.
- Rules, function, migration, restore, component, and emulator E2E suites pass in CI.
- Lint, full unit suite, archive safety suites, and production build pass.
- Deployment of Storage, functions, rules, migration, and frontend is ordered, approved, reproducible, and observable.
- Architecture, lifecycle, security, migration, restore, monitoring, and rollback documentation matches the shipped system.

## 10/10 Completion Scorecard

| Dimension         | Gate for 10/10                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Security          | All emulator abuse cases pass; server-only writes; custom-claim admin; portal source protected                                        |
| Correctness       | State machine, atomic RTDB commits, idempotency, concurrency, and every failure-injection case pass                                   |
| Durability        | Independent immutable revisioned Storage backup, checksum/generation verification, approved retention, RPO zero after acknowledgement |
| Recoverability    | Admin CLI, reconciler, runbook, legacy/current/TIR restore drills, and agreed RTO proven                                              |
| Data completeness | Idempotent migration and count/hash reconciliation finish with zero unexplained records                                               |
| UI/UX             | Correct cross-owner identity, honest errors/progress, accessible controls, bounded large-list DOM, deterministic E2E                  |
| Test evidence     | Unit, component, rules, functions, migration, restore, emulator E2E, lint, and build gates all green in CI                            |
| Operations        | Reproducible deployment, environment approvals, structured monitoring/alerts, rollback, and post-deploy canary evidence               |

Do not call the archive hardening complete or score it 10/10 if any row is partial, waived without an approved risk record, tested only with mocks where an emulator/staging proof is required, or represented only by an unchecked PR checklist.
