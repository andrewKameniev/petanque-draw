import { describe, expect, it } from 'vitest';
import {
  CLUB_COMMAND as COMMAND,
  CLUB_STATUS as STATUS,
  CLUB_PHASE as PHASE,
  CLUB_STAGES,
  createClubEncounter,
  applyClubEncounterCommand,
  validateClubRoster,
  validateClubLineup,
  registerClub,
  validClubScore,
  clubGameWithResult,
  updateClubGame,
} from '../src/services/club-encounter';

function club(clubId, count = 8) {
  return {
    clubId,
    title: `Club ${clubId}`,
    players: Array.from({ length: count }, (_, i) => ({
      id: `${clubId}-${i}`,
      name: `Name ${i}`,
      surname: `Surname ${i}`,
      club_id: clubId,
      gender: i < 2 ? 'female' : 'male',
    })),
  };
}
const clubs = [club('a'), club('b')];
function lineup(team, stageIndex) {
  const indices =
    stageIndex === 0
      ? [[0], [1], [2], [3], [4], [5]]
      : stageIndex === 1
        ? [
            [0, 2],
            [1, 3],
            [4, 5],
          ]
        : [
            [0, 2, 3],
            [1, 4, 5],
          ];
  return indices.map((position) => position.map((i) => team.players[i].id));
}
const apply = (encounter, command) =>
  applyClubEncounterCommand(encounter, clubs, command, { at: '2026-10-08T10:00:00Z', actorId: 'arbiter' });
function start(encounter, stageIndex) {
  encounter = apply(encounter, {
    type: COMMAND.LINEUPS,
    stageIndex,
    positions1: lineup(clubs[0], stageIndex),
    positions2: lineup(clubs[1], stageIndex),
  });
  return apply(encounter, { type: COMMAND.START, stageIndex });
}
function score(encounter, stageIndex, gameIndex, firstWins = true, complete = true) {
  return apply(encounter, {
    type: COMMAND.SCORE,
    stageIndex,
    gameIndex,
    score1: firstWins ? 13 : 7,
    score2: firstWins ? 7 : 13,
    complete,
  });
}
function finishStage(encounter, stageIndex, wins = []) {
  encounter = start(encounter, stageIndex);
  for (let i = 0; i < CLUB_STAGES[stageIndex].count; i++) encounter = score(encounter, stageIndex, i, wins.includes(i));
  return encounter;
}

describe('club tournament rosters and captain lineups', () => {
  it.each([8, 9])('accepts up to %i registered players and freezes the submitted data by value', (count) => {
    const entry = club('a', count);
    const tournament = { preferences: { clubRosterSize: count }, teams: [] };
    const teams = registerClub(tournament, entry);
    entry.players[0].name = 'changed';
    expect(teams[0].players[0].name).toBe('Name 0');
    expect(tournament.teams).toEqual([]);
    expect(() => validateClubRoster(club('b', 7), count)).not.toThrow();
    expect(() => validateClubRoster(club('b', 6), count)).not.toThrow();
    expect(() => validateClubRoster(club('b', 5), count)).toThrow('rosterSize');
    expect(() => validateClubRoster(club('b', count + 1), count)).toThrow('rosterSize');
  });
  it('rejects missing identity, duplicate players and a wrong captain club', () => {
    for (const [field, value, error] of [
      ['name', '', 'player'],
      ['id', '', 'player'],
      ['club_id', 'b', 'club'],
    ]) {
      const team = club('a');
      team.players[0][field] = value;
      expect(() => validateClubRoster(team, 8)).toThrow(error);
    }
    const team = club('a');
    team.players[1].id = team.players[0].id;
    expect(() => validateClubRoster(team, 8)).toThrow('duplicate');
    const second = club('b');
    second.players[0].id = 'a-0';
    expect(() => validateClubRoster(second, 8, [club('a')])).toThrow('duplicate');
  });
  it('allows players from other profile clubs and requires no gender field', () => {
    const team = club('a');
    team.players.forEach((player) => {
      delete player.gender;
    });
    team.players[2].club_id = 'guest-club';
    const saved = registerClub({ preferences: { clubRosterSize: 8 }, teams: [] }, team)[0];
    expect(saved.clubId).toBe('a');
    expect(saved.captainId).toBe('a-0');
    expect(saved.players[2].club_id).toBe('guest-club');
    expect(() => registerClub({ preferences: { clubRosterSize: 8 }, games: [[]] }, team)).toThrow('locked');
  });
  it.each([0, 1, 2])('validates every position and six unique registered participants in stage %i', (stageIndex) => {
    const positions = lineup(clubs[0], stageIndex);
    expect(() => validateClubLineup(clubs[0], stageIndex, positions)).not.toThrow();
    expect(() => validateClubLineup(clubs[0], stageIndex, positions.slice(1))).toThrow('lineup');
    positions[1][0] = positions[0][0];
    expect(() => validateClubLineup(clubs[0], stageIndex, positions)).toThrow('duplicate');
    positions[1][0] = 'b-6';
    expect(() => validateClubLineup(clubs[0], stageIndex, positions)).toThrow('player');
  });
  it('leaves gender checks to the referee while still validating six distinct players', () => {
    const team = club('a');
    team.players.forEach((player) => {
      delete player.gender;
    });
    [0, 1, 2].forEach((stageIndex) =>
      expect(() => validateClubLineup(team, stageIndex, lineup(team, stageIndex))).not.toThrow(),
    );
  });
});

describe('club match lifecycle', () => {
  it('pairs by submitted position, persists changes before start, locks lineups after start', () => {
    const source = createClubEncounter(clubs, 8);
    const positions2 = lineup(clubs[1], 0);
    [positions2[1], positions2[5]] = [positions2[5], positions2[1]];
    const command = { type: COMMAND.LINEUPS, stageIndex: 0, positions1: lineup(clubs[0], 0), positions2 };
    const published = apply(source, command);
    expect(source.stages[0].published).toBe(false);
    expect(published.stages[0].games[1].players2).toEqual(['b-5']);
    const reloaded = JSON.parse(JSON.stringify(published));
    expect(apply(reloaded, command)).toEqual(published);
    const edited = apply(published, { ...command, positions2: lineup(clubs[1], 0) });
    expect(edited.audit.at(-1).before[1][1]).toEqual(['b-5']);
    const active = apply(edited, { type: COMMAND.START, stageIndex: 0 });
    expect(() => apply(active, command)).toThrow('locked');
    expect(() => apply(active, { ...command, stageIndex: 1 })).toThrow('previous');
  });
  it('accepts different players at the next stage and allows reuse across stages', () => {
    let encounter = finishStage(createClubEncounter(clubs, 8), 0, [0, 1, 2]);
    const positions1 = lineup(clubs[0], 1);
    positions1[2] = ['a-6', 'a-7'];
    encounter = apply(encounter, { type: COMMAND.LINEUPS, stageIndex: 1, positions1, positions2: lineup(clubs[1], 1) });
    expect(encounter.stages[1].games[2].players1).toEqual(['a-6', 'a-7']);
    expect(encounter.stages[1].games[0].players1).toContain('a-0');
  });
  it.each([
    [13, 0, true],
    [0, 13, true],
    [13, 12, true],
    [13, 13, false],
    [12, 7, false],
    [13, -1, false],
    [14, 3, false],
    [13, 1.5, false],
    [13, null, false],
    [13, '', false],
  ])('validates %s:%s', (a, b, valid) => {
    expect(validClubScore(a, b)).toBe(valid);
  });
  it('awards no points until confirmation and recomputes corrections idempotently', () => {
    let encounter = start(createClubEncounter(clubs, 8), 0);
    encounter = score(encounter, 0, 0, true, false);
    expect(encounter.points).toEqual([0, 0]);
    expect(clubGameWithResult({ team_1: 'A', team_2: 'B' }, encounter).team_1_score).toBeNull();
    encounter = score(encounter, 0, 0);
    expect(encounter.points).toEqual([2, 0]);
    expect(score(encounter, 0, 0)).toEqual(encounter);
    encounter = score(encounter, 0, 0, false);
    expect(encounter.points).toEqual([0, 2]);
  });
  it('produces the specified 16:15 example and 31 points after all 11 games', () => {
    let encounter = finishStage(createClubEncounter(clubs, 8), 0, [0, 1, 2, 3]);
    encounter = finishStage(encounter, 1, [0]);
    encounter = finishStage(encounter, 2, [0]);
    expect(encounter.points).toEqual([16, 15]);
    expect(encounter.status).toBe(STATUS.COMPLETED);
    expect(encounter.winnerClubId).toBe('a');
    expect(encounter.stages.map((stage) => stage.games[0].points1)).toEqual([2, 3, 5]);
  });
  it('requires all 11 qualification games even after a club has 21 points', () => {
    let encounter = finishStage(createClubEncounter(clubs, 8), 0, [0, 1, 2, 3, 4, 5]);
    encounter = finishStage(encounter, 1, [0, 1, 2]);
    expect(encounter.points).toEqual([21, 0]);
    expect(encounter.status).toBe(STATUS.ACTIVE);
    expect(encounter.winnerClubId).toBeNull();
    expect(() => apply(encounter, { type: COMMAND.CONTINUE })).toThrow('locked');
  });
  it('automatically stops playoffs at 16+, preserving in-progress games for continuation', () => {
    let encounter = finishStage(createClubEncounter(clubs, 8, PHASE.PLAYOFF), 0, [0, 1, 2, 3, 4, 5]);
    encounter = start(encounter, 1);
    encounter = apply(encounter, {
      type: COMMAND.SCORE,
      stageIndex: 1,
      gameIndex: 2,
      score1: 4,
      score2: 6,
      complete: false,
    });
    encounter = score(encounter, 1, 0);
    encounter = score(encounter, 1, 1);
    expect(encounter.points).toEqual([18, 0]);
    expect(encounter.status).toBe(STATUS.COMPLETED);
    expect(encounter.stages[1].games[2]).toMatchObject({ status: STATUS.NOT_PLAYED, score1: 4, score2: 6, points1: 0 });
    expect(encounter.stages[2].games.every((game) => game.status === STATUS.NOT_PLAYED)).toBe(true);
    encounter = apply(encounter, { type: COMMAND.CONTINUE });
    expect(encounter.stages[1].games[2]).toMatchObject({ status: STATUS.ACTIVE, score1: 4, score2: 6 });
    expect(encounter.stages[2].games[0].status).toBe(STATUS.PLANNED);
    encounter = score(encounter, 1, 2);
    expect(encounter.status).toBe(STATUS.ACTIVE);
    encounter = finishStage(encounter, 2, [0, 1]);
    expect(encounter.points).toEqual([31, 0]);
    expect(encounter.status).toBe(STATUS.COMPLETED);
  });
  it('reopens a stopped playoff when a correction removes the clinching result', () => {
    let encounter = finishStage(createClubEncounter(clubs, 8, PHASE.PLAYOFF), 0, [0, 1, 2, 3, 4, 5]);
    encounter = start(encounter, 1);
    encounter = score(score(encounter, 1, 0), 1, 1);
    encounter = score(encounter, 1, 1, false);
    expect(encounter.points).toEqual([15, 3]);
    expect(encounter.status).toBe(STATUS.ACTIVE);
    expect(encounter.winnerClubId).toBeNull();
    expect(encounter.stages[1].games[2].status).toBe(STATUS.ACTIVE);
  });
  it('rejects editing an already advanced playoff stage', () => {
    const tournament = {
      preferences: { clubRosterSize: 8 },
      teams: clubs,
      playOffStage: 1,
      playOffBracket: { stages: [{ stageLabel: 2, teams: [{ team_1: clubs[0].title, team_2: clubs[1].title }] }] },
    };
    expect(() =>
      updateClubGame(
        tournament,
        { kind: 'playoff', stageIndex: 0, gameIndex: 0 },
        { type: COMMAND.START, stageIndex: 0 },
      ),
    ).toThrow('locked');
  });
});
