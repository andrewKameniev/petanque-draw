import { createTournamentData } from '../../src/services/tournament-record';
import {
  createClubEncounter,
  applyClubEncounterCommand,
  CLUB_COMMAND,
  CLUB_PHASE,
  clubGameWithResult,
} from '../../src/services/club-encounter';

export function makeClub(clubId, size = 8) {
  return {
    clubId,
    title: `Club ${clubId}`,
    captainId: `${clubId}-0`,
    players: Array.from({ length: size }, (_, index) => ({
      id: `${clubId}-${index}`,
      name: `Name${index}`,
      surname: `Surname${index}`,
      club_id: index === 7 ? 'guest' : clubId,
      club: index === 7 ? 'Guest club' : `Club ${clubId}`,
    })),
    wins: 0,
    opponents: [],
    pointsPlus: 0,
    pointsMinus: 0,
    lanes: [],
  };
}
export function makeClubTournament() {
  return createTournamentData({
    system: 'groups',
    preferences: { clubRosterSize: 8 },
    teams: [makeClub('a'), makeClub('b')],
    roundIsActive: true,
    games: [[{ team_1: 'Club a', team_2: 'Club b', team_1_score: null, team_2_score: null, status: 'not_started' }]],
  });
}
export function clubPositions(club, stageIndex) {
  const size = stageIndex + 1;
  return Array.from({ length: 6 / size }, (_, position) =>
    Array.from({ length: size }, (_, member) => club.players[position * size + member].id),
  );
}
export function beginClubStage(encounter, clubs, stageIndex) {
  const published = applyClubEncounterCommand(encounter, clubs, {
    type: CLUB_COMMAND.LINEUPS,
    stageIndex,
    positions1: clubPositions(clubs[0], stageIndex),
    positions2: clubPositions(clubs[1], stageIndex),
  });
  return applyClubEncounterCommand(published, clubs, { type: CLUB_COMMAND.START, stageIndex });
}
export function clubMatchAfterSingles(tournament, phase = CLUB_PHASE.QUALIFICATION) {
  let encounter = beginClubStage(createClubEncounter(tournament.teams, 8, phase), tournament.teams, 0);
  for (let gameIndex = 0; gameIndex < 6; gameIndex++)
    encounter = applyClubEncounterCommand(encounter, tournament.teams, {
      type: CLUB_COMMAND.SCORE,
      stageIndex: 0,
      gameIndex,
      score1: 13,
      score2: 7,
      complete: true,
    });
  encounter = beginClubStage(encounter, tournament.teams, 1);
  return clubGameWithResult(tournament.games[0][0], encounter);
}
