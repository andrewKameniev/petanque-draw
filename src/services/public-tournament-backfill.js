import { Buffer } from 'node:buffer';
import {
  createPublicTournamentProjection,
  PUBLIC_TOURNAMENT_PROJECTION_ERROR,
  readPublicTournamentProjection,
} from './public-tournament-projection.js';
import {
  createTournamentRecord,
  getTournamentMain,
  getTournamentMetadata,
  hasTournamentGroup,
  normalizeTournamentRecord,
} from './tournament-record.js';

export const PUBLIC_TOURNAMENT_BACKFILL_ACTION = Object.freeze({
  SKIP: 'skip',
  WRITE: 'write',
});

export const PUBLIC_TOURNAMENT_BACKFILL_STATUS = Object.freeze({
  APPLIED: 'applied',
  CONCURRENT_CHANGE: 'concurrent-change',
  DEFERRED_LIMIT: 'deferred-limit',
  FAILED: 'failed',
  INVALID_CANONICAL: 'invalid-canonical',
  INVALID_DERIVED_PROJECTION: 'invalid-derived-projection',
  MALFORMED: 'malformed',
  MISSING: 'missing',
  PARTIAL: 'partial',
  REVISION_EXHAUSTED: 'revision-exhausted',
  ROLLED_BACK: 'rolled-back',
  STALE: 'stale',
  SUPERSEDED: 'superseded',
  UNSUPPORTED_VERSION: 'unsupported-version',
  VALID: 'valid',
});

const GENERATED_TOURNAMENT_NAME = /^Tournament [A-Z]$/;
const DEFAULT_EMPTY_COMPETITION = getTournamentMain(normalizeTournamentRecord(createTournamentRecord()));
const DEFAULT_EMPTY_METADATA_FIELDS = new Set(['id', 'name', 'createdAt', 'tournamentMessage']);

export class PublicTournamentBackfillError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'PublicTournamentBackfillError';
    this.code = code;
    if (options.result) this.result = options.result;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function publicTournamentBackfillValuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => publicTournamentBackfillValuesEqual(item, right[index]))
    );
  }
  if (!isObject(left) || !isObject(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) => key === rightKeys[index] && publicTournamentBackfillValuesEqual(left[key], right[key]),
    )
  );
}

function serializedBytes(value) {
  return Buffer.byteLength(JSON.stringify(value));
}

function firebaseStoredComparableValue(value) {
  if (value == null) return undefined;
  if (!Array.isArray(value) && !isObject(value)) return value;

  const entries = Object.entries(value)
    .map(([key, item]) => [key, firebaseStoredComparableValue(item)])
    .filter(([, item]) => item !== undefined);
  if (!entries.length) return undefined;
  return Object.fromEntries(entries);
}

function nextProjectionRevision(currentProjection) {
  const revision = currentProjection?.revision;
  if (revision == null) return 1;
  if (revision === Number.MAX_SAFE_INTEGER) return null;
  return Number.isSafeInteger(revision) && revision >= 0 ? revision + 1 : 1;
}

function statusForProjectionReason(reason) {
  if (reason === PUBLIC_TOURNAMENT_PROJECTION_ERROR.MISSING) return PUBLIC_TOURNAMENT_BACKFILL_STATUS.MISSING;
  if (reason === PUBLIC_TOURNAMENT_PROJECTION_ERROR.PARTIAL) return PUBLIC_TOURNAMENT_BACKFILL_STATUS.PARTIAL;
  if (reason === PUBLIC_TOURNAMENT_PROJECTION_ERROR.UNSUPPORTED_VERSION) {
    return PUBLIC_TOURNAMENT_BACKFILL_STATUS.UNSUPPORTED_VERSION;
  }
  return PUBLIC_TOURNAMENT_BACKFILL_STATUS.MALFORMED;
}

/**
 * Identify old records that still exactly match the application's generated
 * empty tournament. This is diagnostic only: candidates remain eligible for
 * projection so a later canonical-read revocation cannot break their links.
 */
export function isDefaultEmptyPublicTournamentCandidate(canonicalRecord) {
  const normalized = normalizeTournamentRecord(canonicalRecord);
  if (!normalized || hasTournamentGroup(normalized, 'B') || normalized.activeGroup !== 'A') return false;

  const metadata = getTournamentMetadata(normalized);
  if (!GENERATED_TOURNAMENT_NAME.test(metadata.name || '')) return false;
  if (Object.keys(metadata).some((field) => !DEFAULT_EMPTY_METADATA_FIELDS.has(field))) return false;
  if (metadata.tournamentMessage != null && metadata.tournamentMessage !== '') return false;

  const metadataFields = new Set(Object.keys(metadata));
  const competition = Object.fromEntries(
    Object.entries(getTournamentMain(normalized) || {}).filter(
      ([field]) => !metadataFields.has(field) && field !== 'activeGroup' && field !== 'groupB',
    ),
  );
  if (competition.isPlayOff === false) delete competition.isPlayOff;

  return publicTournamentBackfillValuesEqual(competition, DEFAULT_EMPTY_COMPETITION);
}

export function planPublicTournamentBackfill({
  ownerUid,
  tournamentId,
  canonicalRecord,
  currentProjection = null,
  updatedAt = Date.now(),
}) {
  const current = currentProjection ?? null;
  const currentRead = readPublicTournamentProjection(current, { ownerUid, tournamentId });
  if (currentRead.valid) {
    if (canonicalMatchesPublicTournamentProjection(canonicalRecord, current, { ownerUid, tournamentId })) {
      return {
        action: PUBLIC_TOURNAMENT_BACKFILL_ACTION.SKIP,
        status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.VALID,
      };
    }
  }

  const currentStatus = currentRead.valid
    ? PUBLIC_TOURNAMENT_BACKFILL_STATUS.STALE
    : statusForProjectionReason(currentRead.reason);
  if (currentStatus === PUBLIC_TOURNAMENT_BACKFILL_STATUS.UNSUPPORTED_VERSION) {
    return {
      action: PUBLIC_TOURNAMENT_BACKFILL_ACTION.SKIP,
      status: currentStatus,
    };
  }

  const revision = nextProjectionRevision(current);
  if (revision == null) {
    return {
      action: PUBLIC_TOURNAMENT_BACKFILL_ACTION.SKIP,
      status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.REVISION_EXHAUSTED,
    };
  }

  const projection = createPublicTournamentProjection(canonicalRecord, { revision, updatedAt, complete: true });
  if (!projection) {
    return {
      action: PUBLIC_TOURNAMENT_BACKFILL_ACTION.SKIP,
      status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.INVALID_CANONICAL,
    };
  }

  const derivedRead = readPublicTournamentProjection(projection, { ownerUid, tournamentId });
  if (!derivedRead.valid) {
    return {
      action: PUBLIC_TOURNAMENT_BACKFILL_ACTION.SKIP,
      status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.INVALID_DERIVED_PROJECTION,
    };
  }

  return {
    action: PUBLIC_TOURNAMENT_BACKFILL_ACTION.WRITE,
    status: currentStatus,
    projection,
    canonicalBytes: serializedBytes(canonicalRecord),
    projectionBytes: serializedBytes(projection),
  };
}

export function canonicalMatchesPublicTournamentProjection(
  canonicalRecord,
  projection,
  { ownerUid, tournamentId } = {},
) {
  const derived = createPublicTournamentProjection(canonicalRecord, {
    revision: projection?.revision ?? 1,
    updatedAt: projection?.updatedAt ?? 0,
    complete: true,
  });
  if (!derived) return false;
  const derivedRead = readPublicTournamentProjection(derived, { ownerUid, tournamentId });
  const storedRead = readPublicTournamentProjection(projection, { ownerUid, tournamentId });
  return (
    derivedRead.valid &&
    storedRead.valid &&
    publicTournamentBackfillValuesEqual(
      firebaseStoredComparableValue(derivedRead.record) ?? null,
      firebaseStoredComparableValue(storedRead.record) ?? null,
    )
  );
}

function createSummary({ dryRun }) {
  return {
    mode: dryRun ? 'dry-run' : 'apply',
    ownersScanned: 0,
    tournamentsScanned: 0,
    orphanProjections: 0,
    defaultEmptyCandidates: 0,
    valid: 0,
    stale: 0,
    missing: 0,
    partial: 0,
    malformed: 0,
    unsupportedVersion: 0,
    invalidCanonical: 0,
    invalidDerivedProjection: 0,
    revisionExhausted: 0,
    planned: 0,
    writesAttempted: 0,
    applied: 0,
    concurrentChanges: 0,
    rolledBack: 0,
    superseded: 0,
    deferredLimit: 0,
    failed: 0,
    canonicalBytes: 0,
    projectionBytes: 0,
  };
}

function recordPlannedStatus(summary, plan, { placeholderCandidate = false } = {}) {
  if (placeholderCandidate) summary.defaultEmptyCandidates += 1;
  const counters = {
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.VALID]: 'valid',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.STALE]: 'stale',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.MISSING]: 'missing',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.PARTIAL]: 'partial',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.MALFORMED]: 'malformed',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.UNSUPPORTED_VERSION]: 'unsupportedVersion',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.INVALID_CANONICAL]: 'invalidCanonical',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.INVALID_DERIVED_PROJECTION]: 'invalidDerivedProjection',
    [PUBLIC_TOURNAMENT_BACKFILL_STATUS.REVISION_EXHAUSTED]: 'revisionExhausted',
  };
  const counter = counters[plan.status];
  if (counter) summary[counter] += 1;
  if (plan.action === PUBLIC_TOURNAMENT_BACKFILL_ACTION.WRITE) {
    summary.planned += 1;
    summary.canonicalBytes += plan.canonicalBytes;
    summary.projectionBytes += plan.projectionBytes;
  }
}

async function applyPlan({ repository, ownerUid, tournamentId, currentProjection, plan }) {
  const write = await repository.compareAndSetProjection({
    ownerUid,
    tournamentId,
    expectedProjection: currentProjection ?? null,
    nextProjection: plan.projection,
  });
  if (!write.committed) return { status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.CONCURRENT_CHANGE };
  const writtenProjection = write.projection;
  if (!writtenProjection) {
    throw new PublicTournamentBackfillError(
      'MISSING_COMMITTED_PROJECTION',
      `The committed transaction for ${ownerUid}/${tournamentId} returned no projection snapshot`,
    );
  }

  let latestCanonical;
  try {
    latestCanonical = await repository.getCanonical({ ownerUid, tournamentId });
  } catch (error) {
    const rollback = await repository.compareAndSetProjection({
      ownerUid,
      tournamentId,
      expectedProjection: writtenProjection,
      nextProjection: currentProjection ?? null,
    });
    if (rollback.committed) {
      return { status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.ROLLED_BACK, reason: 'verification-failed' };
    }
    throw new PublicTournamentBackfillError(
      'VERIFY_FAILED_AFTER_WRITE',
      `Could not verify ${ownerUid}/${tournamentId} after its projection write`,
      { cause: error },
    );
  }

  if (
    latestCanonical &&
    canonicalMatchesPublicTournamentProjection(latestCanonical, writtenProjection, { ownerUid, tournamentId })
  ) {
    return { status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.APPLIED };
  }

  const rollback = await repository.compareAndSetProjection({
    ownerUid,
    tournamentId,
    expectedProjection: writtenProjection,
    nextProjection: currentProjection ?? null,
  });
  return rollback.committed
    ? {
        status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.ROLLED_BACK,
        reason: latestCanonical ? 'canonical-changed' : 'canonical-deleted',
      }
    : { status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.SUPERSEDED };
}

function recordAppliedStatus(summary, result) {
  if (result.status === PUBLIC_TOURNAMENT_BACKFILL_STATUS.APPLIED) summary.applied += 1;
  if (result.status === PUBLIC_TOURNAMENT_BACKFILL_STATUS.CONCURRENT_CHANGE) summary.concurrentChanges += 1;
  if (result.status === PUBLIC_TOURNAMENT_BACKFILL_STATUS.ROLLED_BACK) summary.rolledBack += 1;
  if (result.status === PUBLIC_TOURNAMENT_BACKFILL_STATUS.SUPERSEDED) summary.superseded += 1;
  if (result.status === PUBLIC_TOURNAMENT_BACKFILL_STATUS.DEFERRED_LIMIT) summary.deferredLimit += 1;
  if (result.status === PUBLIC_TOURNAMENT_BACKFILL_STATUS.FAILED) summary.failed += 1;
}

export async function runPublicTournamentBackfill({
  repository,
  ownerUids = [],
  allOwners = false,
  dryRun = true,
  batchSize = 20,
  maxWrites = Number.POSITIVE_INFINITY,
  clock = Date.now,
  onItem = () => {},
}) {
  if (!repository) throw new PublicTournamentBackfillError('MISSING_REPOSITORY', 'A backfill repository is required');
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
    throw new PublicTournamentBackfillError('INVALID_BATCH_SIZE', 'batchSize must be an integer from 1 to 100');
  }
  if ((!Number.isInteger(maxWrites) || maxWrites < 1) && maxWrites !== Number.POSITIVE_INFINITY) {
    throw new PublicTournamentBackfillError('INVALID_MAX_WRITES', 'maxWrites must be a positive integer');
  }

  const owners = new Set(ownerUids);
  if (allOwners) {
    const discovered = await repository.listOwnerUids();
    discovered.forEach((ownerUid) => owners.add(ownerUid));
  }
  const sortedOwners = [...owners].filter(Boolean).sort();
  if (!sortedOwners.length) {
    throw new PublicTournamentBackfillError('MISSING_SCOPE', 'Provide ownerUids or enable allOwners');
  }

  const summary = createSummary({ dryRun });
  const items = [];

  for (const ownerUid of sortedOwners) {
    const [tournaments, projections] = await Promise.all([
      repository.listTournaments(ownerUid),
      repository.listProjections(ownerUid),
    ]);
    summary.ownersScanned += 1;
    summary.orphanProjections += Object.keys(projections).filter(
      (tournamentId) => !(tournamentId in tournaments),
    ).length;

    const candidates = [];
    for (const tournamentId of Object.keys(tournaments).sort()) {
      const canonicalRecord = tournaments[tournamentId];
      const currentProjection = projections[tournamentId] ?? null;
      const placeholderCandidate = isDefaultEmptyPublicTournamentCandidate(canonicalRecord);
      const plan = planPublicTournamentBackfill({
        ownerUid,
        tournamentId,
        canonicalRecord,
        currentProjection,
        updatedAt: clock(),
      });
      summary.tournamentsScanned += 1;
      recordPlannedStatus(summary, plan, { placeholderCandidate });

      const item = { ownerUid, tournamentId, sourceStatus: plan.status, status: plan.status };
      if (placeholderCandidate) item.placeholderCandidate = true;
      items.push(item);
      if (plan.action === PUBLIC_TOURNAMENT_BACKFILL_ACTION.WRITE) {
        candidates.push({ item, currentProjection, plan });
      } else {
        onItem(item);
      }
    }

    if (dryRun) {
      candidates.forEach(({ item }) => onItem(item));
      continue;
    }

    for (let offset = 0; offset < candidates.length; offset += batchSize) {
      const batch = candidates.slice(offset, offset + batchSize);
      const settled = await Promise.allSettled(
        batch.map(async ({ item, currentProjection, plan }) => {
          if (summary.writesAttempted >= maxWrites) {
            item.status = PUBLIC_TOURNAMENT_BACKFILL_STATUS.DEFERRED_LIMIT;
            recordAppliedStatus(summary, item);
            onItem(item);
            return;
          }
          summary.writesAttempted += 1;
          try {
            const result = await applyPlan({
              repository,
              ownerUid,
              tournamentId: item.tournamentId,
              currentProjection,
              plan,
            });
            Object.assign(item, result);
            recordAppliedStatus(summary, result);
            onItem(item);
          } catch (error) {
            item.status = PUBLIC_TOURNAMENT_BACKFILL_STATUS.FAILED;
            item.reason = error.code || 'BACKFILL_ITEM_FAILED';
            recordAppliedStatus(summary, item);
            onItem(item);
            throw error;
          }
        }),
      );
      const failure = settled.find((result) => result.status === 'rejected');
      if (failure) {
        const error = failure.reason;
        throw new PublicTournamentBackfillError(
          error.code || 'BACKFILL_ITEM_FAILED',
          `Backfill stopped after a batch error: ${error.message}`,
          { cause: error, result: { summary, items } },
        );
      }
    }
  }

  return { summary, items };
}
