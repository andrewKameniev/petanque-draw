# Public Tournament Projection Backfill

This runbook owns the operational contract for populating
`publicTournaments/{ownerUid}/{tournamentId}` from existing canonical tournament
records. The command is never run by an application build, deploy, or merge.

## Safety contract

`npm run backfill:public` is read-only by default. A dry-run derives and validates
the same V1 projection used by the live writer, estimates its size, and reports
what would change.

The report separately counts `defaultEmptyCandidates`: records that still match
the normalized factory defaults, have an auto-generated `Tournament A`–`Z` name,
have no Tournament B, and contain no deliberate metadata. Older application
versions could create these empty records automatically, but there is no stored
provenance flag that proves an individual record is unused. The marker is
therefore diagnostic only: candidates remain in `planned`, payload estimates,
and apply writes. Projecting them keeps Public/TV safe when anonymous canonical
reads are revoked later, and neither the marker nor the backfill deletes them.

Apply mode:

- skips complete valid V1 projections whose public fields already match the
  canonical tournament, so repeating a successful run is a no-op;
- skips unknown future schema versions instead of replacing them;
- writes only `publicTournaments/{ownerUid}/{tournamentId}` and never rewrites or
  deletes canonical tournaments;
- uses a transaction to write only when the projection still equals the value
  observed during the scan;
- rereads the canonical tournament after each write and keeps the projection
  only when its public fields still match;
- compares public records after recursively applying Realtime Database's
  storage semantics, so removed `null`, empty-array, and empty-object children
  do not create false stale results;
- conditionally restores the previous projection if the canonical public data
  changed or disappeared during the write, using the transaction's actually
  persisted snapshot as the rollback guard;
- reports orphan projections but never deletes them.

An apply run additionally requires exact project and database-host confirmations
plus a new JSON report path. The path is reserved before Firebase initialization
and an existing report file is never overwritten, which prevents reusing an
earlier audit artifact accidentally. If a batch fails, the runner waits for all
in-flight items and records the partial summary and item outcomes before exiting.

## Credentials and prerequisites

Use Application Default Credentials with permission to read canonical
tournaments and transact on `publicTournaments`. Keep service-account files and
tokens outside the repository. Verify the target project and Realtime Database
URL in the Firebase console before every run.

Install dependencies and confirm the command locally:

```sh
npm install
npm run backfill:public -- --help
```

The production database URL currently used by this project is:

```text
https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app
```

## Dry-run

Start with one known owner:

```sh
npm run backfill:public -- \
  --project-id petanque-draw \
  --database-url https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app \
  --owner OWNER_UID
```

Then inspect the full discovered scope without writes:

```sh
npm run backfill:public -- \
  --project-id petanque-draw \
  --database-url https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app \
  --all-owners \
  --report ../petanque-draw-backfill-reports/dry-run-YYYYMMDD-HHMM.json
```

`--all-owners` discovers owner UIDs from user tournament maps and the public
archive index. Add repeated `--owner OWNER_UID` arguments for known owners not
present in those indexes.

Stop and investigate before apply if the report contains unsupported versions,
invalid canonical records, exhausted revisions, derived-projection failures, or
unexpected orphan projections.

## Canary apply

Use a unique report path and cap the first authorized write batch:

```sh
npm run backfill:public -- \
  --project-id petanque-draw \
  --database-url https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app \
  --owner OWNER_UID \
  --apply \
  --confirm-project petanque-draw \
  --confirm-database-host petanque-draw-default-rtdb.europe-west1.firebasedatabase.app \
  --batch-size 5 \
  --max-writes 10 \
  --report ../petanque-draw-backfill-reports/canary-YYYYMMDD-HHMM.json
```

Confirm the Public/TV pages for canary tournaments use complete V1 projections,
show current results, and have no new console or permission errors. Review the
report for concurrent changes, rollbacks, or superseded rollback attempts before
continuing.

## Full apply and completion

After a clean canary and separate production approval, remove `--max-writes` and
run the authorized owner scope or `--all-owners`. Keep concurrency modest:

```sh
npm run backfill:public -- \
  --project-id petanque-draw \
  --database-url https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app \
  --all-owners \
  --apply \
  --confirm-project petanque-draw \
  --confirm-database-host petanque-draw-default-rtdb.europe-west1.firebasedatabase.app \
  --batch-size 20 \
  --report ../petanque-draw-backfill-reports/full-YYYYMMDD-HHMM.json
```

Run the same scope again in dry-run mode. Completion means every supported
canonical tournament, including default-empty candidates, has a valid V1
projection and no write is planned. Preserve the reports outside source control.

If application rollback is needed, keep or restore anonymous canonical reads so
the reader can use compatibility mode. Do not delete projections or canonical
records as a backfill rollback. Revoking canonical reads is a later, separately
approved rules rollout after the measured compatibility window.
