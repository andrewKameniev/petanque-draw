import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { cleanupOwnedTournament, createFixtureId, readOwnedTournament, seedOwnedTournament } from './firebase-fixtures';

const standardPortalTeams = [
  {
    id: 201,
    name: 'Portal Team',
    players: [
      {
        id: '101',
        surname: 'Коваль',
        name: 'Олег',
        second_name: 'Петрович',
        club_id: 2,
        club: 'Київ',
        sport_title: 'КМСУ',
        avatar_url: 'https://cdn.example/task08-standard-avatar.png',
        club_logo_url: 'https://cdn.example/task08-standard-club.png',
      },
    ],
  },
  {
    id: 202,
    players: [
      {
        id: '102',
        surname: 'Дубль',
        name: 'Анна',
        avatar_url: 'https://cdn.example/task08-wrong-one.png',
      },
      {
        id: '103',
        surname: 'Дубль',
        name: 'Анна',
        avatar_url: 'https://cdn.example/task08-wrong-two.png',
      },
    ],
  },
];

const tirPortalTeams = [
  {
    id: '301',
    name: 'Стрілець Марія',
    players: [
      {
        id: '401',
        surname: 'Стрілець',
        name: 'Марія',
        second_name: 'Іванівна',
        club_id: 1,
        club: 'Львів',
        sport_title: 'МСУ',
        avatar_url: 'https://cdn.example/task08-tir-avatar.png',
        club_logo_url: 'https://cdn.example/task08-tir-club.png',
      },
    ],
  },
];

test.describe('Portal player synchronization', () => {
  test.describe.configure({ timeout: 60000 });

  let standardId;
  let tirId;
  let errorId;

  test.beforeAll(async () => {
    standardId = createFixtureId(80);
    tirId = createFixtureId(81);
    errorId = createFixtureId(82);

    await seedOwnedTournament(
      standardId,
      {
        name: 'Task 08 Standard Archive',
        date: '2026-08-05',
        portalIdTournament: 'task08-standard',
        main: {
          system: 'swiss',
          teams: [
            {
              title: 'Portal Team',
              players: [
                {
                  id: 101,
                  surname: 'Старий',
                  name: 'Олег',
                  second_name: '',
                  avatar_url: 'https://cdn.example/task08-old-avatar.png',
                },
              ],
            },
            {
              title: 'Ambiguous',
              players: [
                {
                  surname: 'Дубль',
                  name: 'Анна',
                  avatar_url: 'https://cdn.example/task08-ambiguous-existing.png',
                },
              ],
            },
          ],
          games: [],
          tournamentIsFinished: true,
          preferences: {},
        },
      },
      { status: 'archived' },
    );

    await seedOwnedTournament(
      tirId,
      {
        name: 'Task 08 TIR Archive',
        date: '2026-08-05',
        portalIdTournament: 'task08-tir',
        system: 'tir',
        teams: [],
        games: [],
        tournamentIsFinished: true,
        tirConfig: { rounds: 1, junior: false },
        tirParticipants: [{ id: 1, name: 'Стрілець Марія', portalTeamId: 301, scores: {} }],
        preferences: {},
      },
      { status: 'archived' },
    );

    await seedOwnedTournament(
      errorId,
      {
        name: 'Task 08 Error Archive',
        portalIdTournament: 'task08-error',
        system: 'swiss',
        teams: [
          {
            title: 'Unchanged',
            players: [{ id: 501, surname: 'Без', name: 'Змін', avatar_url: 'https://cdn.example/before.png' }],
          },
        ],
        games: [],
        tournamentIsFinished: true,
        preferences: {},
      },
      { status: 'archived' },
    );
  });

  test.afterAll(async () => {
    await Promise.all([standardId, tirId, errorId].map((id) => cleanupOwnedTournament(id)));
  });

  test.beforeEach(async ({ page }) => {
    await page.route('**/tournament/team_export/**', async (route) => {
      const pathname = new globalThis.URL(route.request().url()).pathname;
      if (pathname.endsWith('/task08-standard')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ teams: standardPortalTeams }),
        });
        return;
      }
      if (pathname.endsWith('/task08-tir')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ teams: tirPortalTeams }),
        });
        return;
      }
      if (pathname.endsWith('/task08-error')) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'unavailable' }),
        });
        return;
      }
      await route.abort();
    });

    await login(page);
    await page.locator('[data-testid="tournament-name-row"]').waitFor({ state: 'visible' });
    await page.goto('/#/archived');
    await expect(page).toHaveURL(/#\/archived$/);
    await expect(page.locator('.archived-sidebar')).toBeVisible();
  });

  test('refreshes standard archive media and protocol while preserving ambiguous players', async ({ page }) => {
    await page.locator(`.archived-sidebar__item[data-tournament-id="${standardId}"]`).click();
    const refreshMedia = page.locator('.archived-sidebar__actions .archived-links__btn--secondary');
    await refreshMedia.click();
    await expect(page.locator('.toast')).toContainText('Оновлено');

    const persisted = await readOwnedTournament(standardId);
    expect(persisted.main.teams[0].players[0]).toEqual(
      expect.objectContaining({
        avatar_url: 'https://cdn.example/task08-standard-avatar.png',
        club_logo_url: 'https://cdn.example/task08-standard-club.png',
        club_id: 2,
        club: 'Київ',
      }),
    );
    expect(persisted.main.teams[1].players[0].avatar_url).toBe('https://cdn.example/task08-ambiguous-existing.png');
    expect(persisted.teams).toBeUndefined();

    await page.locator('.tournament-nav__btn--teams').click();
    await expect(page.locator('[data-team-title="Portal Team"] .player-chip__avatar')).toHaveAttribute(
      'src',
      'https://cdn.example/task08-standard-avatar.png',
    );
    await expect(page.locator('[data-team-title="Ambiguous"] .player-chip__avatar')).toHaveAttribute(
      'src',
      'https://cdn.example/task08-ambiguous-existing.png',
    );

    await page.locator('.tournament-nav__btn--protocol').click();
    await page.getByRole('button', { name: 'Оновити дані гравців' }).click();
    await expect(page.locator('#protocol')).toContainText('Петрович');
    const savedProtocol = await page.evaluate((id) => localStorage.getItem(`protocol_${id}`), standardId);
    expect(savedProtocol).toContain('Петрович');
  });

  test('refreshes archived TIR participant media and protocol through the team adapter', async ({ page }) => {
    await page.locator(`.archived-sidebar__item[data-tournament-id="${tirId}"]`).click();
    await page.locator('.archived-sidebar__actions .archived-links__btn--secondary').click();
    await expect(page.locator('.tir-plist__avatar')).toHaveAttribute(
      'src',
      'https://cdn.example/task08-tir-avatar.png',
    );

    const persisted = await readOwnedTournament(tirId);
    expect(persisted.tirParticipants[0]).toEqual(
      expect.objectContaining({
        avatar_url: 'https://cdn.example/task08-tir-avatar.png',
        club_logo_url: 'https://cdn.example/task08-tir-club.png',
        club_id: 1,
        club: 'Львів',
      }),
    );
    expect(persisted.main).toBeUndefined();

    await page.locator('.tir-nav').getByRole('button', { name: 'Протокол' }).click();
    await page.getByRole('button', { name: 'Оновити дані гравців' }).click();
    await expect(page.locator('#protocol')).toContainText('Стрілець Марія Іванівна');
    const savedProtocol = await page.evaluate((id) => localStorage.getItem(`tir_protocol_${id}`), tirId);
    expect(savedProtocol).toContain('Стрілець Марія Іванівна');
  });

  test('leaves archive data unchanged and shows a visible portal error', async ({ page }) => {
    await page.locator(`.archived-sidebar__item[data-tournament-id="${errorId}"]`).click();
    const before = await readOwnedTournament(errorId);

    await page.locator('.archived-sidebar__actions .archived-links__btn--secondary').click();
    const toast = page.locator('.toast');
    await expect(toast).toHaveClass(/toast--error/);
    await expect(toast).toContainText('503');

    expect(await readOwnedTournament(errorId)).toEqual(before);
  });
});
