import {
  CLUB_ROSTER_SIZES,
  CLUB_MIN_PLAYERS,
  CLUB_ERROR,
  ClubEncounterError,
  isClubCompetition,
  registerClub,
  updateClubGame,
  CLUB_TECHNICAL_SCORE,
} from './club-encounter';
import { saveResultsForRound } from './draw';

export const CLUB_CHANGE = Object.freeze({
  CONFIGURE: 'configure',
  REGISTER: 'register',
  MATCH: 'match',
  IMPORT: 'import',
});
export const CLUB_SYSTEMS = Object.freeze(['swiss', 'groups', 'playoff']);

// The export currently has no discipline field. Ordinary portal teams contain
// at most three players; club entries contain enough players for all six slots.
export function isPortalClubTournament(data) {
  return (
    Array.isArray(data?.teams) &&
    data.teams.length > 0 &&
    data.teams.every((team) => team.players?.length >= CLUB_MIN_PLAYERS)
  );
}

export function createPortalClubDraft(team) {
  const players = (team?.players || []).map((player) => ({
    ...player,
    id: String(player.id ?? ''),
    name: player.name || '',
    surname: player.surname || '',
    club_id: String(player.club_id ?? ''),
    club: player.club || '',
  }));
  return {
    rating: Number(team?.power) || 0,
    clubId: players[0]?.club_id || '',
    title: players[0]?.club || '',
    captainId: players[0]?.id || '',
    players,
    ...(team?.id != null ? { portalTeamId: team.id } : {}),
  };
}

// The plan keeps Firebase paths granular while replacing owned reactive fields.
export function planClubCompetitionChange(tournament, change, metadata) {
  const next = JSON.parse(JSON.stringify(tournament));
  const replacements = {};
  const paths = {};
  if (change.type === CLUB_CHANGE.CONFIGURE) {
    if (next.teams?.length || next.games?.length || next.playOff) throw new ClubEncounterError(CLUB_ERROR.LOCKED);
    if (change.rosterSize !== null && !CLUB_ROSTER_SIZES.includes(change.rosterSize))
      throw new ClubEncounterError(CLUB_ERROR.ROSTER_SIZE);
    next.preferences.clubRosterSize = change.rosterSize;
    if (change.rosterSize !== null) {
      Object.assign(next.preferences, {
        maxScore: 13,
        playOffFormat: 'single',
        playB: false,
        withBarrage: false,
        timeLimitEnabled: false,
        cochonettesEnabled: false,
        cochonettesEnabledPlayoff: false,
        technical: { ...CLUB_TECHNICAL_SCORE },
      });
      if (!CLUB_SYSTEMS.includes(next.system)) next.system = 'groups';
    }
    replacements.preferences = next.preferences;
    replacements.system = next.system;
    Object.assign(paths, replacements);
  } else if (change.type === CLUB_CHANGE.IMPORT) {
    const configured = planClubCompetitionChange(next, { type: CLUB_CHANGE.CONFIGURE, rosterSize: change.rosterSize });
    Object.assign(next, configured.replacements);
    for (const club of change.clubs) next.teams = registerClub(next, club);
    Object.assign(replacements, configured.replacements, { teams: next.teams });
    Object.assign(paths, replacements);
  } else if (change.type === CLUB_CHANGE.REGISTER) {
    replacements.teams = registerClub(next, change.club);
    paths.teams = replacements.teams;
  } else if (change.type === CLUB_CHANGE.MATCH) {
    const result = updateClubGame(next, change.locator, change.command, metadata);
    const segments = result.path.split('/');
    const field = segments.shift();
    let parent = next[field];
    const last = segments.pop();
    segments.forEach((segment) => {
      parent = parent[segment];
    });
    parent[last] = result.game;
    replacements[field] = next[field];
    paths[result.path] = result.game;
    if (change.locator.kind === 'round' && (change.locator.roundIndex < next.games.length - 1 || !next.roundIsActive)) {
      next.teams.forEach((team) => Object.assign(team, { wins: 0, opponents: [], pointsPlus: 0, pointsMinus: 0 }));
      const finishedRounds = next.roundIsActive ? next.games.length - 1 : next.games.length;
      for (let round = 0; round < finishedRounds; round++) saveResultsForRound(next, round);
      replacements.teams = next.teams;
      paths.teams = next.teams;
    }
    if (next.tournamentIsFinished && result.game.status !== 'finished') {
      replacements.tournamentIsFinished = false;
      paths.tournamentIsFinished = false;
      if (change.locator.kind === 'playoff' || change.locator.kind === 'thirdPlace') {
        replacements.playOffStage = 1;
        paths.playOffStage = 1;
      }
    }
  } else throw new ClubEncounterError(CLUB_ERROR.MISSING);
  return { replacements, paths };
}

export function validateClubCompetitionStart(tournament) {
  if (!isClubCompetition(tournament)) return;
  if (
    !CLUB_SYSTEMS.includes(tournament.system) ||
    tournament.preferences.playOffFormat === 'double' ||
    tournament.preferences.playB ||
    tournament.preferences.withBarrage
  ) {
    throw new ClubEncounterError(CLUB_ERROR.LOCKED);
  }
  // Revalidate all rosters before allowing a legacy/imported record to start.
  const empty = { ...tournament, teams: [], games: [], playOff: null };
  for (const club of tournament.teams || []) empty.teams = registerClub(empty, club);
}
