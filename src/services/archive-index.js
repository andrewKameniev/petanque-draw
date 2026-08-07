import { equalTo, get, orderByChild, query, ref, remove, set, update } from 'firebase/database';
import { database as db } from '@/firebase';
import { getTournamentMain, getTournamentMetadata } from '@/services/tournament-record';

const SUPER_ADMIN_EMAIL = 'nemo15.alex@gmail.com';

export const archiveIndexService = {
  getAll({ includeLegacy = false } = {}) {
    const archiveRef = ref(db, 'archive');
    return get(includeLegacy ? archiveRef : query(archiveRef, orderByChild('visibility'), equalTo('public')));
  },
  getOne(tid) {
    return get(ref(db, `archive/${tid}`));
  },
  write(tid, entry) {
    return set(ref(db, `archive/${tid}`), entry);
  },
  remove(tid) {
    return remove(ref(db, `archive/${tid}`));
  },
  updatePortalId(tid, ownerUid, portalId) {
    return update(ref(db), {
      [`${ownerUid}/tournaments/${tid}/portalIdTournament`]: portalId,
      [`archive/${tid}/portalId`]: portalId,
    });
  },
};

export const archiveBackupService = {
  write(tid, tournamentData, meta) {
    const backup = {
      meta: {
        tournamentId: tid,
        archivedAt: meta.archivedAt,
        ownerUid: meta.ownerUid,
        ownerEmail: meta.ownerEmail,
        portalId: meta.portalId || null,
      },
      tournament: tournamentData,
    };
    return set(ref(db, `backups/${tid}`), backup);
  },
  getOne(tid) {
    return get(ref(db, `backups/${tid}`));
  },
};

export function buildArchiveIndexEntry(tournament, { ownerUid }) {
  const main = getTournamentMain(tournament);
  const metadata = getTournamentMetadata(tournament);
  const name = metadata.name || tournament.name || '';
  const date = main?.games?.[0]?.[0]?.date || metadata.date || metadata.createdAt || '';

  return {
    name,
    nameLower: name.toLowerCase(),
    date,
    system: main?.system || null,
    teamsCount: main?.teams?.length || main?.tirParticipants?.length || 0,
    roundsPlayed: main?.games?.length || 0,
    ownerUid,
    visibility: 'public',
    portalId: metadata.portalIdTournament || null,
    archivedAt: new Date().toISOString(),
    tournamentIsFinished: main?.tournamentIsFinished || false,
    isTestTournament: main?.preferences?.isTestTournament === true,
  };
}

export function isArchiveIndexEntryEligible(entry) {
  return (
    !!entry?.ownerUid && !!entry?.portalId && entry.tournamentIsFinished === true && entry.isTestTournament !== true
  );
}

export function canDeleteArchived(entry, userEmail, userUid) {
  if (entry?.portalId) return userEmail === SUPER_ADMIN_EMAIL && isArchiveIndexEntryEligible(entry);
  if (userUid === entry?.ownerUid) return true;
  return false;
}
