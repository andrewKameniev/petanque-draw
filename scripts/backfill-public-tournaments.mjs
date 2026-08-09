/* eslint-disable no-console */
import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import {
  PublicTournamentBackfillError,
  publicTournamentBackfillValuesEqual,
  runPublicTournamentBackfill,
} from '../src/services/public-tournament-backfill.js';

const HELP = `Usage:
  npm run backfill:public -- --project-id <id> --database-url <url> --owner <uid>
  npm run backfill:public -- --project-id <id> --database-url <url> --all-owners

Dry-run is the default. Production writes additionally require:
  --apply --confirm-project <id> --confirm-database-host <host> --report <path>

Options:
  --owner <uid>          Scan one owner; repeat to include more owners
  --all-owners           Discover owners from users/ and archive/
  --batch-size <1-100>   Concurrent projection transactions (default: 20)
  --max-writes <count>   Cap write attempts for a canary batch
  --report <path>        Write a JSON audit report; required with --apply
  --dry-run              Explicitly keep the read-only default
  --apply                Enable projection-only conditional writes
  --confirm-project <id> Required with --apply and must match --project-id
  --confirm-database-host <host>
                         Required with production --apply and must match the URL
  --help                 Show this help

Environment fallbacks:
  GOOGLE_CLOUD_PROJECT, FIREBASE_DATABASE_URL, GOOGLE_APPLICATION_CREDENTIALS
`;

export class PublicTournamentBackfillCliError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PublicTournamentBackfillCliError';
    this.code = code;
  }
}

function readValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new PublicTournamentBackfillCliError('MISSING_OPTION_VALUE', `${option} requires a value`);
  }
  return value;
}

export function parsePublicTournamentBackfillArgs(argv) {
  const parsed = {
    owners: [],
    allOwners: false,
    dryRun: true,
    batchSize: 20,
    maxWrites: Number.POSITIVE_INFINITY,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === '--help') parsed.help = true;
    else if (option === '--all-owners') parsed.allOwners = true;
    else if (option === '--dry-run') {
      if (parsed.mode === 'apply') {
        throw new PublicTournamentBackfillCliError('CONFLICTING_MODES', 'Use either --dry-run or --apply');
      }
      parsed.mode = 'dry-run';
      parsed.dryRun = true;
    } else if (option === '--apply') {
      if (parsed.mode === 'dry-run') {
        throw new PublicTournamentBackfillCliError('CONFLICTING_MODES', 'Use either --dry-run or --apply');
      }
      parsed.mode = 'apply';
      parsed.dryRun = false;
    } else if (option === '--owner') parsed.owners.push(readValue(argv, index++, option));
    else if (option === '--project-id') parsed.projectId = readValue(argv, index++, option);
    else if (option === '--database-url') parsed.databaseUrl = readValue(argv, index++, option);
    else if (option === '--confirm-project') parsed.confirmProject = readValue(argv, index++, option);
    else if (option === '--confirm-database-host') parsed.confirmDatabaseHost = readValue(argv, index++, option);
    else if (option === '--report') parsed.reportPath = readValue(argv, index++, option);
    else if (option === '--batch-size') parsed.batchSize = Number(readValue(argv, index++, option));
    else if (option === '--max-writes') parsed.maxWrites = Number(readValue(argv, index++, option));
    else throw new PublicTournamentBackfillCliError('UNKNOWN_OPTION', `Unknown option: ${option}`);
  }
  return parsed;
}

function validFirebaseKey(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !['.', '#', '$', '[', ']', '/'].some((character) => value.includes(character)) &&
    ![...value].some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)
  );
}

function databaseUrlMatchesProject(databaseUrl, projectId) {
  const hostname = new URL(databaseUrl).hostname;
  return (
    hostname === `${projectId}.firebaseio.com` ||
    hostname === `${projectId}-default-rtdb.firebaseio.com` ||
    (hostname.startsWith(`${projectId}-default-rtdb.`) && hostname.endsWith('.firebasedatabase.app'))
  );
}

export function resolvePublicTournamentBackfillOptions(parsed, env = process.env) {
  if (parsed.help) return parsed;
  const projectId = parsed.projectId || env.GOOGLE_CLOUD_PROJECT || env.GCLOUD_PROJECT;
  const databaseUrl = parsed.databaseUrl || env.FIREBASE_DATABASE_URL;
  if (!projectId) throw new PublicTournamentBackfillCliError('MISSING_PROJECT', 'Provide --project-id');
  if (!databaseUrl) throw new PublicTournamentBackfillCliError('MISSING_DATABASE_URL', 'Provide --database-url');
  if (!validFirebaseKey(projectId)) {
    throw new PublicTournamentBackfillCliError(
      'INVALID_PROJECT',
      'project-id contains an invalid Firebase key character',
    );
  }
  parsed.owners.forEach((ownerUid) => {
    if (!validFirebaseKey(ownerUid)) {
      throw new PublicTournamentBackfillCliError('INVALID_OWNER', `Invalid owner UID: ${ownerUid}`);
    }
  });
  if (!parsed.owners.length && !parsed.allOwners) {
    throw new PublicTournamentBackfillCliError('MISSING_SCOPE', 'Provide --owner or --all-owners');
  }
  if (!Number.isInteger(parsed.batchSize) || parsed.batchSize < 1 || parsed.batchSize > 100) {
    throw new PublicTournamentBackfillCliError('INVALID_BATCH_SIZE', '--batch-size must be an integer from 1 to 100');
  }
  if (parsed.maxWrites !== Number.POSITIVE_INFINITY && (!Number.isInteger(parsed.maxWrites) || parsed.maxWrites < 1)) {
    throw new PublicTournamentBackfillCliError('INVALID_MAX_WRITES', '--max-writes must be a positive integer');
  }

  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new PublicTournamentBackfillCliError('INVALID_DATABASE_URL', '--database-url must be a valid URL');
  }
  const emulator = !!env.FIREBASE_DATABASE_EMULATOR_HOST;
  if (!emulator && (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash)) {
    throw new PublicTournamentBackfillCliError(
      'INVALID_DATABASE_URL',
      'Production database URL must use HTTPS and target the database root',
    );
  }
  if (!emulator && !databaseUrlMatchesProject(databaseUrl, projectId)) {
    throw new PublicTournamentBackfillCliError(
      'PROJECT_DATABASE_MISMATCH',
      'Database hostname does not match project-id',
    );
  }
  if (!parsed.dryRun) {
    if (parsed.confirmProject !== projectId) {
      throw new PublicTournamentBackfillCliError(
        'PROJECT_CONFIRMATION_REQUIRED',
        '--confirm-project must exactly match --project-id',
      );
    }
    if (!parsed.reportPath) {
      throw new PublicTournamentBackfillCliError('REPORT_REQUIRED', '--report is required with --apply');
    }
    if (!emulator && parsed.confirmDatabaseHost !== url.hostname) {
      throw new PublicTournamentBackfillCliError(
        'DATABASE_CONFIRMATION_REQUIRED',
        '--confirm-database-host must exactly match the database URL hostname',
      );
    }
  }

  return { ...parsed, projectId, databaseUrl, databaseHost: url.hostname, emulator };
}

function snapshotChildren(snapshot) {
  const children = {};
  snapshot.forEach((child) => {
    children[child.key] = child.val();
  });
  return children;
}

export function createFirebasePublicTournamentBackfillRepository(database) {
  return {
    async listOwnerUids() {
      const [usersSnapshot, archiveSnapshot] = await Promise.all([
        database.ref('users').get(),
        database.ref('archive').get(),
      ]);
      const owners = new Set();
      usersSnapshot.forEach((userSnapshot) => {
        owners.add(userSnapshot.key);
        userSnapshot.child('tournaments').forEach((tournamentSnapshot) => {
          const ownerUid = tournamentSnapshot.child('ownerUid').val();
          if (validFirebaseKey(ownerUid)) owners.add(ownerUid);
        });
      });
      archiveSnapshot.forEach((tournamentSnapshot) => {
        const ownerUid = tournamentSnapshot.child('ownerUid').val();
        if (validFirebaseKey(ownerUid)) owners.add(ownerUid);
      });
      return [...owners].sort();
    },

    async listTournaments(ownerUid) {
      return snapshotChildren(await database.ref(`${ownerUid}/tournaments`).get());
    },

    async listProjections(ownerUid) {
      return snapshotChildren(await database.ref(`publicTournaments/${ownerUid}`).get());
    },

    async getCanonical({ ownerUid, tournamentId }) {
      const snapshot = await database.ref(`${ownerUid}/tournaments/${tournamentId}`).get();
      return snapshot.exists() ? snapshot.val() : null;
    },

    async compareAndSetProjection({ ownerUid, tournamentId, expectedProjection, nextProjection }) {
      const reference = database.ref(`publicTournaments/${ownerUid}/${tournamentId}`);
      const result = await reference.transaction(
        (current) => {
          if (!publicTournamentBackfillValuesEqual(current ?? null, expectedProjection ?? null)) return undefined;
          return nextProjection ?? null;
        },
        undefined,
        false,
      );
      return { committed: result.committed };
    },
  };
}

function printableItem(item) {
  return `${item.status.padEnd(20)} ${item.ownerUid}/${item.tournamentId}${item.reason ? ` (${item.reason})` : ''}`;
}

function printSummary(summary) {
  const storageMiB = summary.projectionBytes / 1024 / 1024;
  console.log('\nPublic tournament projection backfill');
  console.log(`mode: ${summary.mode}`);
  console.log(`owners scanned: ${summary.ownersScanned}`);
  console.log(`tournaments scanned: ${summary.tournamentsScanned}`);
  console.log(`valid projections: ${summary.valid}`);
  console.log(`planned projections: ${summary.planned}`);
  console.log(`applied projections: ${summary.applied}`);
  console.log(`deferred/concurrent: ${summary.deferredLimit + summary.concurrentChanges}`);
  console.log(`rolled back/superseded: ${summary.rolledBack + summary.superseded}`);
  console.log(`failed: ${summary.failed}`);
  console.log(`unsupported versions: ${summary.unsupportedVersion}`);
  console.log(`invalid canonical/derived: ${summary.invalidCanonical + summary.invalidDerivedProjection}`);
  console.log(`revision exhausted: ${summary.revisionExhausted}`);
  console.log(`orphan projections (reported only): ${summary.orphanProjections}`);
  console.log(`planned projection payload: ${storageMiB.toFixed(2)} MiB`);
}

async function writeReport(reportPath, report, { exclusive = false } = {}) {
  const target = resolve(reportPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: 'utf8',
    flag: exclusive ? 'wx' : 'w',
  });
  return target;
}

export async function runPublicTournamentBackfillCli(argv, env = process.env) {
  const parsed = parsePublicTournamentBackfillArgs(argv);
  const options = resolvePublicTournamentBackfillOptions(parsed, env);
  if (options.help) {
    console.log(HELP);
    return { help: true };
  }

  const startedAt = new Date().toISOString();
  const reportBase = {
    projectId: options.projectId,
    databaseHost: options.databaseHost,
    emulatorHost: options.emulator ? env.FIREBASE_DATABASE_EMULATOR_HOST : null,
    mode: options.dryRun ? 'dry-run' : 'apply',
    ownerUids: options.owners,
    allOwners: options.allOwners,
    batchSize: options.batchSize,
    maxWrites: Number.isFinite(options.maxWrites) ? options.maxWrites : null,
    startedAt,
  };
  let reportPath;
  if (options.reportPath) {
    reportPath = await writeReport(options.reportPath, { status: 'started', ...reportBase }, { exclusive: true });
  }

  let app;

  try {
    const appOptions = { projectId: options.projectId, databaseURL: options.databaseUrl };
    if (!options.emulator) appOptions.credential = applicationDefault();
    app = initializeApp(appOptions, `public-tournament-backfill-${process.pid}-${Date.now()}`);
    const database = getDatabase(app);
    const repository = createFirebasePublicTournamentBackfillRepository(database);
    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: options.owners,
      allOwners: options.allOwners,
      dryRun: options.dryRun,
      batchSize: options.batchSize,
      maxWrites: options.maxWrites,
      onItem(item) {
        if (item.status !== 'valid') console.log(printableItem(item));
      },
    });
    printSummary(result.summary);
    if (reportPath) {
      await writeReport(reportPath, {
        status: 'complete',
        ...reportBase,
        completedAt: new Date().toISOString(),
        summary: result.summary,
        items: result.items,
      });
      console.log(`report: ${reportPath}`);
    }
    return result;
  } catch (error) {
    if (reportPath) {
      try {
        await writeReport(reportPath, {
          status: 'failed',
          ...reportBase,
          completedAt: new Date().toISOString(),
          error: { code: error.code || 'BACKFILL_FAILED', message: error.message },
          summary: error.result?.summary ?? null,
          items: error.result?.items ?? [],
        });
      } catch (reportError) {
        console.error(`REPORT_WRITE_FAILED: ${reportError.message}`);
      }
    }
    throw error;
  } finally {
    if (app) await deleteApp(app);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  runPublicTournamentBackfillCli(process.argv.slice(2)).catch((error) => {
    const code =
      error instanceof PublicTournamentBackfillError || error instanceof PublicTournamentBackfillCliError
        ? error.code
        : 'BACKFILL_FAILED';
    console.error(`${code}: ${error.message}`);
    process.exitCode = 1;
  });
}
