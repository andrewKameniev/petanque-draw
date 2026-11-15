/* eslint-disable no-console */
import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { createHash } from 'node:crypto';
import { readFile, appendFile, mkdir, mkdtemp, realpath, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createPublicTournamentProjection } from '../src/services/public-tournament-projection.js';
import { isTournamentEnvelope, migrateLegacyTournamentRecord } from '../src/services/tournament-record.js';

const REPOSITORY_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const HELP = `Usage:
  node scripts/migrate-all-legacy-tournaments.mjs --dump <database.json.gz> --snapshot-dir <outside-repo-dir>
  node scripts/migrate-all-legacy-tournaments.mjs --project-id <id> --database-url <url> --snapshot-dir <outside-repo-dir>

Both commands are read-only by default. The live command saves a complete private
database snapshot and a report before doing anything else. To apply the exact
reviewed live plan, add:
  --apply --confirm-project <id> --confirm-plan <sha256> --confirm-editors-paused
  --confirm-compatible-code-and-rules-deployed
  --confirm-active-rounds-paused --confirm-partials-skipped

The last two confirmations are needed only when the plan contains active rounds
or incomplete fragments. Incomplete records are never reconstructed or written.
Close all editor and scorer tabs before apply; reload them after it finishes.
`;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function hasPriority(value) {
  if (Array.isArray(value)) return value.some(hasPriority);
  if (!isObject(value)) return false;
  return Object.hasOwn(value, '.priority') || Object.values(value).some(hasPriority);
}

/** Realtime Database omits null and empty object/array children on a full write. */
export function compactFirebaseValue(value) {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const items = value.map(compactFirebaseValue);
    return items.some((item) => item !== null) ? items : null;
  }
  if (!isObject(value)) return value;
  const entries = Object.entries(value)
    .map(([key, item]) => [key, compactFirebaseValue(item)])
    .filter(([, item]) => item !== null);
  return entries.length ? Object.fromEntries(entries) : null;
}

function validProjectUrl(projectId, databaseUrl) {
  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('INVALID_DATABASE_URL');
  }
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('INVALID_DATABASE_URL');
  }
  if (
    url.hostname !== `${projectId}.firebaseio.com` &&
    url.hostname !== `${projectId}-default-rtdb.firebaseio.com` &&
    !(url.hostname.startsWith(`${projectId}-default-rtdb.`) && url.hostname.endsWith('.firebasedatabase.app'))
  ) {
    throw new Error('PROJECT_DATABASE_MISMATCH');
  }
  return url.toString();
}

export function parseBulkMigrationArgs(argv) {
  const options = {};
  const values = new Map([
    ['--dump', 'dump'],
    ['--snapshot-dir', 'snapshotDir'],
    ['--project-id', 'projectId'],
    ['--database-url', 'databaseUrl'],
    ['--confirm-project', 'confirmProject'],
    ['--confirm-plan', 'confirmPlan'],
  ]);
  const flags = new Map([
    ['--help', 'help'],
    ['--apply', 'apply'],
    ['--confirm-editors-paused', 'confirmEditorsPaused'],
    ['--confirm-compatible-code-and-rules-deployed', 'confirmCompatibleDeployment'],
    ['--confirm-active-rounds-paused', 'confirmActiveRoundsPaused'],
    ['--confirm-partials-skipped', 'confirmPartialsSkipped'],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (flags.has(argument)) options[flags.get(argument)] = true;
    else if (values.has(argument)) {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`MISSING_VALUE: ${argument}`);
      options[values.get(argument)] = value;
    } else throw new Error(`UNKNOWN_OPTION: ${argument}`);
  }
  if (options.help) return options;
  if (!options.snapshotDir) throw new Error('SNAPSHOT_DIR_REQUIRED');
  if (options.dump) {
    if (options.projectId || options.databaseUrl || options.apply) throw new Error('DUMP_IS_READ_ONLY');
  } else {
    if (!options.projectId || !options.databaseUrl) throw new Error('PROJECT_AND_DATABASE_REQUIRED');
    if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('EMULATOR_HOST_SET');
    options.databaseUrl = validProjectUrl(options.projectId, options.databaseUrl);
  }
  if (
    options.apply &&
    (options.confirmProject !== options.projectId ||
      !/^[a-f0-9]{64}$/.test(options.confirmPlan || '') ||
      !options.confirmEditorsPaused ||
      !options.confirmCompatibleDeployment)
  ) {
    throw new Error('APPLY_CONFIRMATION_REQUIRED');
  }
  return options;
}

/** Plan against an exact database snapshot; this function never mutates it. */
export function planBulkLegacyMigration(root, exportedRoot = root) {
  if (!isObject(root)) throw new Error('INVALID_DATABASE_ROOT');
  const candidates = [];
  const partial = [];
  const blocked = [];
  const fingerprints = [];
  let newFormat = 0;
  let activeRounds = 0;
  for (const [ownerUid, ownerNode] of Object.entries(root)) {
    if (!isObject(ownerNode?.tournaments)) continue;
    for (const [tournamentId, source] of Object.entries(ownerNode.tournaments)) {
      const path = `${ownerUid}/tournaments/${tournamentId}`;
      const projection = root.publicTournaments?.[ownerUid]?.[tournamentId] ?? null;
      fingerprints.push({ path, source: sha256(source), projection: sha256(projection) });
      if (isTournamentEnvelope(source)) {
        newFormat += 1;
        continue;
      }
      if (!isObject(source) || typeof source.system !== 'string') {
        partial.push({
          path,
          fields: isObject(source) ? Object.keys(source).sort() : [],
          hasCompletePublicProjection: projection?.complete === true,
          hasOwnerMap: isObject(root.users?.[ownerUid]?.tournaments?.[tournamentId]),
        });
        continue;
      }
      try {
        if (hasPriority(exportedRoot?.[ownerUid]?.tournaments?.[tournamentId])) {
          throw new Error('MIGRATION_PRIORITY_PRESENT');
        }
        const migrated = migrateLegacyTournamentRecord(source);
        const expected = compactFirebaseValue(migrated);
        const projectionOptions = { revision: 1, updatedAt: 0 };
        if (
          !isDeepStrictEqual(
            createPublicTournamentProjection(source, projectionOptions),
            createPublicTournamentProjection(expected, projectionOptions),
          )
        ) {
          throw new Error('PUBLIC_PROJECTION_WOULD_CHANGE');
        }
        const hasActiveRound = source.roundIsActive === true || source.groupB?.roundIsActive === true;
        if (hasActiveRound) activeRounds += 1;
        candidates.push({ path, ownerUid, tournamentId, source, migrated, expected, projection, hasActiveRound });
      } catch (error) {
        blocked.push({ path, reason: error.message });
      }
    }
  }
  fingerprints.sort((a, b) => a.path.localeCompare(b.path));
  candidates.sort((a, b) => a.path.localeCompare(b.path));
  partial.sort((a, b) => a.path.localeCompare(b.path));
  blocked.sort((a, b) => a.path.localeCompare(b.path));
  const summary = {
    total: fingerprints.length,
    newFormat,
    ready: candidates.length,
    partial: partial.length,
    blocked: blocked.length,
    activeRounds,
    planSha256: sha256(fingerprints),
  };
  return { summary, candidates, partial, blocked };
}

/** Apply one exact plan through an injected adapter so conflict and verification paths are testable. */
export async function applyBulkLegacyMigration(plan, adapter, onVerified = async () => {}) {
  for (const candidate of plan.candidates) {
    const committed = await adapter.compareAndSwap(candidate);
    if (!committed) throw new Error(`CANONICAL_CHANGED: ${candidate.path}`);
    const [stored, projection] = await Promise.all([
      adapter.read(candidate.path),
      adapter.read(`publicTournaments/${candidate.ownerUid}/${candidate.tournamentId}`),
    ]);
    if (!isDeepStrictEqual(stored, candidate.expected)) throw new Error(`POST_WRITE_MISMATCH: ${candidate.path}`);
    if (!isDeepStrictEqual(projection, candidate.projection)) {
      throw new Error(`PROJECTION_CHANGED: ${candidate.path}`);
    }
    await onVerified(candidate);
  }
}

/** Firebase REST ETags make the comparison atomic even when the SDK cache starts empty. */
export async function compareAndSwapTournament(candidate, { databaseUrl, accessToken, fetchImpl = fetch }) {
  const url = `${databaseUrl}${candidate.path.split('/').map(encodeURIComponent).join('/')}.json`;
  const authorization = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const currentResponse = await fetchImpl(`${url}?format=export`, {
    headers: { ...authorization, 'X-Firebase-ETag': 'true' },
    signal: globalThis.AbortSignal.timeout(30000),
  });
  if (!currentResponse.ok) throw new Error(`CANONICAL_READ_FAILED: ${currentResponse.status}`);
  const etag = currentResponse.headers.get('etag');
  if (!etag) throw new Error('CANONICAL_ETAG_MISSING');
  if (!isDeepStrictEqual(await currentResponse.json(), candidate.source)) return false;
  const writeResponse = await fetchImpl(url, {
    method: 'PUT',
    headers: { ...authorization, 'If-Match': etag, 'Content-Type': 'application/json' },
    body: JSON.stringify(candidate.migrated),
    signal: globalThis.AbortSignal.timeout(30000),
  });
  if (writeResponse.status === 412) return false;
  if (!writeResponse.ok) throw new Error(`CANONICAL_WRITE_FAILED: ${writeResponse.status}`);
  return true;
}

export function assertApplyPlan(options, plan) {
  if (options.confirmPlan !== plan.summary.planSha256) throw new Error('PLAN_CHANGED');
  if (plan.blocked.length) throw new Error('BLOCKED_RECORDS_REQUIRE_REVIEW');
  if (plan.partial.length && !options.confirmPartialsSkipped) throw new Error('PARTIAL_RECORDS_REQUIRE_REVIEW');
  if (plan.summary.activeRounds && !options.confirmActiveRoundsPaused) {
    throw new Error('ACTIVE_ROUNDS_REQUIRE_CONFIRMATION');
  }
}

async function createPrivateDirectory(base) {
  const fromRepository = relative(REPOSITORY_ROOT, base);
  if (!fromRepository.startsWith('..') && !isAbsolute(fromRepository)) {
    throw new Error('SNAPSHOT_DIR_INSIDE_REPOSITORY');
  }
  await mkdir(base, { recursive: true, mode: 0o700 });
  const actual = await realpath(base);
  const actualFromRepository = relative(REPOSITORY_ROOT, actual);
  if (!actualFromRepository.startsWith('..') && !isAbsolute(actualFromRepository)) {
    throw new Error('SNAPSHOT_DIR_INSIDE_REPOSITORY');
  }
  return mkdtemp(join(actual, 'bulk-legacy-migration-'));
}

async function saveJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
}

async function readDump(path) {
  const bytes = await readFile(path);
  const json = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
  return JSON.parse(json.toString('utf8'));
}

export async function runBulkMigrationCli(argv) {
  const options = parseBulkMigrationArgs(argv);
  if (options.help) {
    console.log(HELP);
    return { help: true };
  }
  let app;
  let credential;
  try {
    if (!options.dump) {
      credential = applicationDefault();
      app = initializeApp(
        { projectId: options.projectId, databaseURL: options.databaseUrl, credential },
        `bulk-legacy-migration-${process.pid}-${Date.now()}`,
      );
    }
    const snapshot = app ? await getDatabase(app).ref('/').get() : null;
    const root = snapshot ? snapshot.val() : await readDump(options.dump);
    const exportedRoot = snapshot?.exportVal() ?? root;
    const plan = planBulkLegacyMigration(root, exportedRoot);
    const directory = await createPrivateDirectory(resolve(options.snapshotDir));
    let backupSha256 = null;
    if (snapshot) {
      const backup = gzipSync(JSON.stringify(exportedRoot));
      backupSha256 = createHash('sha256').update(backup).digest('hex');
      const backupPath = join(directory, 'database-before.json.gz');
      await writeFile(backupPath, backup, {
        mode: 0o600,
        flag: 'wx',
      });
      const storedBackup = await readFile(backupPath);
      if (createHash('sha256').update(storedBackup).digest('hex') !== backupSha256) {
        throw new Error('BACKUP_VERIFICATION_FAILED');
      }
      JSON.parse(gunzipSync(storedBackup).toString('utf8'));
    }
    await saveJson(join(directory, 'report.json'), {
      mode: options.apply ? 'apply' : 'dry-run',
      projectId: options.projectId ?? null,
      databaseUrl: options.databaseUrl ?? null,
      sourceDump: options.dump ?? null,
      capturedAt: new Date().toISOString(),
      backupSha256,
      ...plan.summary,
      candidates: plan.candidates.map(({ path, source, expected, hasActiveRound }) => ({
        path,
        sourceSha256: sha256(source),
        targetSha256: sha256(expected),
        hasActiveRound,
      })),
      partial: plan.partial,
      blocked: plan.blocked,
    });
    console.log(JSON.stringify({ directory, ...plan.summary }));
    if (!options.apply) return { directory, plan };
    assertApplyPlan(options, plan);

    const database = getDatabase(app);
    let verified = 0;
    const adapter = {
      async compareAndSwap(candidate) {
        const accessToken = (await credential.getAccessToken()).access_token;
        return compareAndSwapTournament(candidate, { databaseUrl: options.databaseUrl, accessToken });
      },
      async read(path) {
        return (await database.ref(path).get()).val();
      },
    };
    try {
      await applyBulkLegacyMigration(plan, adapter, async (candidate) => {
        verified += 1;
        await appendFile(
          join(directory, 'verified.jsonl'),
          `${JSON.stringify({ path: candidate.path, verifiedAt: new Date().toISOString() })}\n`,
          { mode: 0o600 },
        );
        if (verified % 25 === 0 || verified === plan.candidates.length)
          console.log(`Verified ${verified}/${plan.candidates.length}`);
      });
      const finalPlan = planBulkLegacyMigration((await database.ref('/').get()).val());
      if (finalPlan.summary.ready !== 0 || finalPlan.summary.blocked !== 0)
        throw new Error('FINAL_SCAN_FOUND_LEGACY_RECORDS');
      await saveJson(join(directory, 'completed.json'), {
        verified,
        remainingPartial: finalPlan.summary.partial,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      await saveJson(join(directory, 'stopped.json'), {
        verified,
        reason: error.message,
        stoppedAt: new Date().toISOString(),
      });
      throw error;
    }
    return { directory, plan, verified };
  } finally {
    if (app) await deleteApp(app);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBulkMigrationCli(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
