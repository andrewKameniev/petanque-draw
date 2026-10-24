/* eslint-disable no-console */
import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { createPublicTournamentProjection } from '../src/services/public-tournament-projection.js';
import { migrateLegacyTournamentRecord } from '../src/services/tournament-record.js';

const HELP = `Usage: node scripts/migrate-legacy-tournament.mjs
  --project-id <id> --database-url <url> --owner <uid> --tournament-id <id>
  --snapshot-dir <ignored-local-directory>

Dry-run and local snapshots are the default. To write the canonical record after
all editors have stopped scoring and closed/reloaded their tournament tabs, add:
  --apply --confirm-project <id> --confirm-owner <uid>
  --confirm-tournament <id> --confirm-editors-paused

The script refuses to write during an active round. It never changes the public
projection, because the before/after projection must be identical.
`;

function validKey(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !['.', '#', '$', '[', ']', '/'].some((character) => value.includes(character)) &&
    ![...value].some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)
  );
}

export function parseMigrationArgs(argv) {
  const options = { apply: false };
  const values = new Map([
    ['--project-id', 'projectId'],
    ['--database-url', 'databaseUrl'],
    ['--owner', 'ownerUid'],
    ['--tournament-id', 'tournamentId'],
    ['--snapshot-dir', 'snapshotDir'],
    ['--confirm-project', 'confirmProject'],
    ['--confirm-owner', 'confirmOwner'],
    ['--confirm-tournament', 'confirmTournament'],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') options.help = true;
    else if (argument === '--apply') options.apply = true;
    else if (argument === '--confirm-editors-paused') options.confirmEditorsPaused = true;
    else if (values.has(argument)) {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`MISSING_VALUE: ${argument}`);
      options[values.get(argument)] = value;
    } else throw new Error(`UNKNOWN_OPTION: ${argument}`);
  }
  if (options.help) return options;
  if (![options.projectId, options.ownerUid, options.tournamentId].every(validKey)) {
    throw new Error('INVALID_PROJECT_OWNER_OR_TOURNAMENT');
  }
  if (!options.snapshotDir) throw new Error('SNAPSHOT_DIR_REQUIRED');
  let url;
  try {
    url = new URL(options.databaseUrl);
  } catch {
    throw new Error('INVALID_DATABASE_URL');
  }
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('INVALID_DATABASE_URL');
  }
  if (
    url.hostname !== `${options.projectId}.firebaseio.com` &&
    url.hostname !== `${options.projectId}-default-rtdb.firebaseio.com` &&
    !(url.hostname.startsWith(`${options.projectId}-default-rtdb.`) && url.hostname.endsWith('.firebasedatabase.app'))
  ) {
    throw new Error('PROJECT_DATABASE_MISMATCH');
  }
  if (
    options.apply &&
    (options.confirmProject !== options.projectId ||
      options.confirmOwner !== options.ownerUid ||
      options.confirmTournament !== options.tournamentId ||
      !options.confirmEditorsPaused)
  ) {
    throw new Error('APPLY_CONFIRMATION_REQUIRED');
  }
  return { ...options, databaseUrl: url.toString(), databaseHost: url.hostname };
}

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function competitionSummary(competition) {
  return {
    teams: competition?.teams?.length ?? 0,
    rounds:
      competition?.games?.map((round) => ({
        games: round?.length ?? 0,
        finished: round?.filter((game) => game?.status === 'finished').length ?? 0,
      })) ?? [],
    roundIsActive: competition?.roundIsActive === true,
  };
}

export function planLegacyTournamentMigration(canonical, projection) {
  const migrated = migrateLegacyTournamentRecord(canonical);
  if (!projection || projection.schemaVersion !== 1 || projection.complete !== true) {
    throw new Error('COMPLETE_PUBLIC_PROJECTION_REQUIRED');
  }
  const projectionOptions = {
    revision: projection.revision,
    updatedAt: projection.updatedAt,
    complete: projection.complete,
  };
  const beforeProjection = createPublicTournamentProjection(canonical, projectionOptions);
  const afterProjection = createPublicTournamentProjection(migrated, projectionOptions);
  if (!isDeepStrictEqual(beforeProjection, projection) || !isDeepStrictEqual(afterProjection, projection)) {
    throw new Error('PUBLIC_PROJECTION_WOULD_CHANGE');
  }
  return {
    migrated,
    summary: {
      sourceSha256: sha256(canonical),
      migratedSha256: sha256(migrated),
      projectionSha256: sha256(projection),
      activeGroup: canonical.activeGroup,
      main: competitionSummary(canonical),
      groupB: competitionSummary(canonical.groupB),
      discardedStaleTournamentB: canonical.tournamentB != null,
      staleTournamentB: competitionSummary(canonical.tournamentB),
      projectionUnchanged: true,
    },
  };
}

async function saveJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
}

async function createSnapshotDirectory(base) {
  await mkdir(resolve(base), { recursive: true, mode: 0o700 });
  const directory = resolve(base, `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`);
  await mkdir(directory, { mode: 0o700 });
  return directory;
}

export async function runMigrationCli(argv) {
  const options = parseMigrationArgs(argv);
  if (options.help) {
    console.log(HELP);
    return { help: true };
  }
  const app = initializeApp(
    { projectId: options.projectId, databaseURL: options.databaseUrl, credential: applicationDefault() },
    `legacy-tournament-migration-${process.pid}-${Date.now()}`,
  );
  try {
    const database = getDatabase(app);
    const canonicalRef = database.ref(`${options.ownerUid}/tournaments/${options.tournamentId}`);
    const projectionRef = database.ref(`publicTournaments/${options.ownerUid}/${options.tournamentId}`);
    const [canonicalSnapshot, projectionSnapshot] = await Promise.all([canonicalRef.get(), projectionRef.get()]);
    if (!canonicalSnapshot.exists()) throw new Error('CANONICAL_TOURNAMENT_MISSING');
    const canonical = canonicalSnapshot.val();
    const projection = projectionSnapshot.val();
    const plan = planLegacyTournamentMigration(canonical, projection);
    const snapshotDirectory = await createSnapshotDirectory(options.snapshotDir);
    const report = {
      mode: options.apply ? 'apply' : 'dry-run',
      status: 'snapshotted',
      projectId: options.projectId,
      databaseHost: options.databaseHost,
      ownerUid: options.ownerUid,
      tournamentId: options.tournamentId,
      capturedAt: new Date().toISOString(),
      ...plan.summary,
    };
    await Promise.all([
      saveJson(resolve(snapshotDirectory, 'canonical-before.json'), canonical),
      saveJson(resolve(snapshotDirectory, 'public-projection-before.json'), projection),
      saveJson(resolve(snapshotDirectory, 'canonical-planned.json'), plan.migrated),
    ]);
    await saveJson(resolve(snapshotDirectory, 'report.json'), report);
    console.log(JSON.stringify({ snapshotDirectory, ...report }, null, 2));

    if (!options.apply) return { snapshotDirectory, report };
    if (canonical.groupB.roundIsActive || canonical.roundIsActive) {
      throw new Error('ACTIVE_ROUND: wait until scoring ends before migrating');
    }

    const result = await canonicalRef.transaction(
      (current) => (isDeepStrictEqual(current, canonical) ? plan.migrated : undefined),
      undefined,
      false,
    );
    if (!result.committed) throw new Error('CANONICAL_CHANGED: take fresh snapshots and retry');
    const [storedCanonical, storedProjection] = await Promise.all([canonicalRef.get(), projectionRef.get()]);
    if (!isDeepStrictEqual(storedCanonical.val(), plan.migrated)) {
      throw new Error(`POST_WRITE_MISMATCH: inspect ${snapshotDirectory} before any retry`);
    }
    if (!isDeepStrictEqual(storedProjection.val(), projection)) {
      throw new Error(`PROJECTION_CHANGED: inspect ${snapshotDirectory} before any retry`);
    }
    await saveJson(resolve(snapshotDirectory, 'applied.json'), {
      appliedAt: new Date().toISOString(),
      canonicalSha256: sha256(storedCanonical.val()),
      projectionSha256: sha256(storedProjection.val()),
    });
    console.log('Migration committed and verified. Reload all editor and scorer tabs before play resumes.');
    return { snapshotDirectory, report, applied: true };
  } finally {
    await deleteApp(app);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runMigrationCli(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
