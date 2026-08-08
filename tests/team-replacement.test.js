import { describe, expect, it } from 'vitest';
import { normalizePortalTeam, replaceTeamInCompetition, TeamReplacementError } from '../src/services/team-replacement';

const OLD_TITLE = 'Kuzmenko One, Kuzmenko Two';
const NEW_TITLE = 'Kuzmenko One';

function createCompetition() {
  const opponents = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];
  const oldTeam = {
    title: OLD_TITLE,
    players: false,
    rating: 11.85,
    wins: 3,
    buhgolts: 15,
    smallBuhgolts: 12,
    pointsPlus: 32,
    pointsMinus: 48,
    lanes: [1, 2, 0, 1, 5],
    opponents,
    club: 'Manual club',
    withdrawn: false,
  };
  const teams = [
    oldTeam,
    ...opponents.map((title, index) => ({
      title,
      portalTeamId: 100 + index,
      opponents: [OLD_TITLE],
    })),
  ];
  const games = opponents.map((title, round) => [
    {
      lane: oldTeam.lanes[round],
      team_1: round % 2 ? title : OLD_TITLE,
      team_2: round % 2 ? OLD_TITLE : title,
      winner: round < 3 ? OLD_TITLE : title,
      score_1: round < 3 ? 13 : 5,
      score_2: round < 3 ? 7 : 13,
    },
  ]);

  return {
    system: 'swiss',
    teams,
    games,
    ranking: [{ title: OLD_TITLE, wins: 3 }],
    groups: [
      [
        {
          ...oldTeam,
          players: [{ id: 'manual-player' }],
          rating: 11.85,
          wins: 1,
          lanes: [9],
        },
      ],
    ],
    barrage: {
      startIndex: 5,
      groups: [
        [
          {
            ...oldTeam,
            players: false,
            rating: 11.85,
            wins: 2,
            opponents: ['Foxtrot'],
          },
        ],
      ],
    },
    playOff: {
      quarterFinals: [{ team_1: OLD_TITLE, team_2: 'Foxtrot', winner: OLD_TITLE }],
    },
    playOffBracket: {
      champion: OLD_TITLE,
      runnerUp: 'Foxtrot',
      placements: { [OLD_TITLE]: 1, Foxtrot: 2 },
    },
    streamPresets: [{ team_1: OLD_TITLE, label: `${OLD_TITLE} (court 1)` }],
    note: `Winner: ${OLD_TITLE}`,
  };
}

const importedPortalTeam = {
  title: NEW_TITLE,
  rating: 11.8594,
  portalTeamId: 3895,
  players: [
    { id: 738, name: 'Volodymyr', surname: 'Kuzmenko' },
    { id: 1393, name: 'Iryna', surname: 'Partner' },
  ],
};

describe('team replacement', () => {
  it('preserves five Swiss rounds and stats while replacing identity and exact references', () => {
    const source = createCompetition();
    const snapshot = JSON.parse(JSON.stringify(source));
    const result = replaceTeamInCompetition(source, OLD_TITLE, importedPortalTeam);
    const team = result.competition.teams[0];

    expect(team).toMatchObject({
      title: NEW_TITLE,
      players: importedPortalTeam.players,
      rating: 11.8594,
      portalTeamId: 3895,
      wins: 3,
      buhgolts: 15,
      smallBuhgolts: 12,
      pointsPlus: 32,
      pointsMinus: 48,
      lanes: [1, 2, 0, 1, 5],
      opponents: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
      club: 'Manual club',
      withdrawn: false,
    });
    expect(result.competition.games).toHaveLength(5);
    expect(result.competition.games.flat().filter((game) => game.winner === NEW_TITLE)).toHaveLength(3);
    expect(result.competition.teams.slice(1).every((entry) => entry.opponents[0] === NEW_TITLE)).toBe(true);
    expect(result.competition.playOff.quarterFinals[0]).toMatchObject({
      team_1: NEW_TITLE,
      winner: NEW_TITLE,
    });
    expect(result.competition.playOffBracket).toMatchObject({ champion: NEW_TITLE });
    expect(result.competition.playOffBracket.placements).toEqual({ [NEW_TITLE]: 1, Foxtrot: 2 });
    expect(result.competition.ranking[0].title).toBe(NEW_TITLE);
    expect(result.competition.ranking[0]).not.toHaveProperty('players');
    expect(result.competition.groups[0][0]).toMatchObject({
      title: NEW_TITLE,
      players: importedPortalTeam.players,
      rating: 11.8594,
      portalTeamId: 3895,
      wins: 1,
      lanes: [9],
    });
    expect(result.competition.barrage.groups[0][0]).toMatchObject({
      title: NEW_TITLE,
      players: importedPortalTeam.players,
      rating: 11.8594,
      portalTeamId: 3895,
      wins: 2,
      opponents: ['Foxtrot'],
    });
    expect(result.competition.streamPresets[0].team_1).toBe(NEW_TITLE);

    expect(result.competition.note).toBe(`Winner: ${OLD_TITLE}`);
    expect(result.competition.streamPresets[0].label).toBe(`${OLD_TITLE} (court 1)`);
    expect(source).toEqual(snapshot);
    expect(result.competition).not.toBe(source);
    expect(result.tournament).toBe(result.competition);
  });

  it('returns only changed leaf paths for one atomic Firebase update', () => {
    const result = replaceTeamInCompetition(createCompetition(), OLD_TITLE, importedPortalTeam);

    expect(result.updates).toMatchObject({
      'teams/0/title': NEW_TITLE,
      'teams/0/players': importedPortalTeam.players,
      'teams/0/rating': 11.8594,
      'teams/0/portalTeamId': 3895,
      'teams/1/opponents/0': NEW_TITLE,
      'games/0/0/team_1': NEW_TITLE,
      'games/0/0/winner': NEW_TITLE,
      'groups/0/0/title': NEW_TITLE,
      'groups/0/0/players': importedPortalTeam.players,
      'groups/0/0/rating': 11.8594,
      'groups/0/0/portalTeamId': 3895,
      'barrage/groups/0/0/title': NEW_TITLE,
      'barrage/groups/0/0/players': importedPortalTeam.players,
      'barrage/groups/0/0/rating': 11.8594,
      'barrage/groups/0/0/portalTeamId': 3895,
      'playOff/quarterFinals/0/team_1': NEW_TITLE,
      'playOffBracket/champion': NEW_TITLE,
      'playOffBracket/placements/Kuzmenko One, Kuzmenko Two': null,
      'playOffBracket/placements/Kuzmenko One': 1,
      'streamPresets/0/team_1': NEW_TITLE,
    });
    expect(result.updates).not.toHaveProperty('teams/0/wins');
    expect(result.updates).not.toHaveProperty('teams/0/club');
    expect(result.changedTopLevelPaths).toEqual(
      expect.arrayContaining([
        'teams',
        'games',
        'groups',
        'barrage',
        'ranking',
        'playOff',
        'playOffBracket',
        'streamPresets',
      ]),
    );
    expect(result).toMatchObject({ oldTitle: OLD_TITLE, newTitle: NEW_TITLE, teamIndex: 0 });
  });

  it('normalizes a raw Portal export and updates club only when it is supplied', () => {
    const rawPortalTeam = {
      name: 'Portal Name',
      power: '24.1563',
      id: 912,
      players: [{ id: 1, name: 'Player' }],
      club: { id: 17, title: 'Poltava' },
    };
    const normalized = normalizePortalTeam(rawPortalTeam);
    const result = replaceTeamInCompetition(createCompetition(), OLD_TITLE, rawPortalTeam);

    expect(normalized).toEqual({
      title: 'Portal Name',
      rating: 24.1563,
      portalTeamId: 912,
      players: [{ id: 1, name: 'Player' }],
      club: { id: 17, title: 'Poltava' },
    });
    expect(result.competition.teams[0].club).toEqual({ id: 17, title: 'Poltava' });
    expect(result.updates['teams/0/club']).toEqual({ id: 17, title: 'Poltava' });
  });

  it('always updates the canonical team even when its stored object is minimal', () => {
    const competition = {
      teams: [{ title: OLD_TITLE, wins: 3 }],
      games: [[{ team_1: OLD_TITLE, team_2: 'Alpha', winner: OLD_TITLE }]],
    };

    const result = replaceTeamInCompetition(competition, OLD_TITLE, importedPortalTeam);

    expect(result.competition.teams[0]).toEqual({
      title: NEW_TITLE,
      wins: 3,
      players: importedPortalTeam.players,
      rating: 11.8594,
      portalTeamId: 3895,
    });
    expect(result.updates).toMatchObject({
      'teams/0/title': NEW_TITLE,
      'teams/0/players': importedPortalTeam.players,
      'teams/0/rating': 11.8594,
      'teams/0/portalTeamId': 3895,
    });
  });

  it('omits updates for identity fields that already have the requested value', () => {
    const competition = createCompetition();
    [competition.teams[0], competition.groups[0][0], competition.barrage.groups[0][0]].forEach((team) => {
      Object.assign(team, importedPortalTeam, { title: OLD_TITLE });
    });

    const result = replaceTeamInCompetition(competition, OLD_TITLE, {
      ...importedPortalTeam,
      title: OLD_TITLE,
    });

    expect(result.updates).toEqual({});
    expect(result.competition).toEqual(competition);
    expect(result.competition).not.toBe(competition);
  });

  it.each([
    [
      'missing source team',
      () => replaceTeamInCompetition(createCompetition(), 'Missing', importedPortalTeam),
      'SOURCE_TEAM_NOT_FOUND',
    ],
    [
      'duplicate source team',
      () => {
        const competition = createCompetition();
        competition.teams.push({ title: OLD_TITLE });
        return replaceTeamInCompetition(competition, OLD_TITLE, importedPortalTeam);
      },
      'SOURCE_TEAM_NOT_UNIQUE',
    ],
    [
      'blank target title',
      () => replaceTeamInCompetition(createCompetition(), OLD_TITLE, { ...importedPortalTeam, title: ' ' }),
      'INVALID_TARGET_TITLE',
    ],
    [
      'reserved target title',
      () =>
        replaceTeamInCompetition(createCompetition(), OLD_TITLE, {
          ...importedPortalTeam,
          title: 'Technical',
        }),
      'RESERVED_TARGET_TITLE',
    ],
    [
      'target title collision',
      () =>
        replaceTeamInCompetition(createCompetition(), OLD_TITLE, {
          ...importedPortalTeam,
          title: 'Alpha',
        }),
      'TARGET_TITLE_COLLISION',
    ],
    [
      'Portal ID collision',
      () =>
        replaceTeamInCompetition(createCompetition(), OLD_TITLE, {
          ...importedPortalTeam,
          portalTeamId: 100,
        }),
      'PORTAL_TEAM_ID_COLLISION',
    ],
  ])('rejects $0', (_label, run, code) => {
    expect(run).toThrowError(TeamReplacementError);
    expect(run).toThrowError(expect.objectContaining({ code }));
  });

  it('rejects an object-key rename that would overwrite existing data', () => {
    const competition = createCompetition();
    competition.playOffBracket.placements[NEW_TITLE] = 9;

    expect(() => replaceTeamInCompetition(competition, OLD_TITLE, importedPortalTeam)).toThrowError(
      expect.objectContaining({ code: 'REFERENCE_KEY_COLLISION' }),
    );
  });

  it('does not rename legacy wrapper metadata or the inactive group', () => {
    const competition = createCompetition();
    competition.name = OLD_TITLE;
    competition.tournamentMessage = OLD_TITLE;
    competition.groupB = {
      teams: [{ title: OLD_TITLE }],
      games: [[{ team_1: OLD_TITLE }]],
    };

    const result = replaceTeamInCompetition(competition, OLD_TITLE, importedPortalTeam);

    expect(result.competition.name).toBe(OLD_TITLE);
    expect(result.competition.tournamentMessage).toBe(OLD_TITLE);
    expect(result.competition.groupB).toEqual(competition.groupB);
    expect(Object.keys(result.updates).some((path) => path.startsWith('groupB/'))).toBe(false);
  });
});
