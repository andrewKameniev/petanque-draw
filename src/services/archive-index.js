import { get, ref, set, remove } from 'firebase/database';
import { database as db } from '@/firebase';
import { getTournamentMain, getTournamentMetadata } from '@/services/tournament-record';

const SUPER_ADMIN_EMAIL = 'nemo15.alex@gmail.com';

export const archiveIndexService = {
  getAll() {
    return get(ref(db, 'archive'));
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

export function buildArchiveIndexEntry(tournament, { ownerUid, ownerEmail }) {
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
    ownerEmail,
    portalId: metadata.portalIdTournament || null,
    archivedAt: new Date().toISOString(),
    tournamentIsFinished: main?.tournamentIsFinished || false,
  };
}

export function canDeleteArchived(entry, userEmail, userUid) {
  if (entry.portalId) return false;
  if (userEmail === SUPER_ADMIN_EMAIL) return true;
  if (userUid === entry.ownerUid) return true;
  return false;
}
