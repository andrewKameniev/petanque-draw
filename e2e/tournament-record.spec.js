import { expect, test } from '@playwright/test';
import { login } from './helpers';
import {
  cleanupOwnedTournament,
  cleanupSharedTournament,
  cleanupTask03Fixtures,
  createFixtureId,
  readOwnedTournament,
  readSharedTournament,
  readUserMapEntry,
  seedOwnedTournament,
  seedSharedTournament,
} from './firebase-fixtures';

function newFormatRecord(name = 'Adapter Wrapper Cup') {
  return {
    name,
    date: '2026-08-05',
    tournamentMessage: 'Wrapper root message',
    activeGroup: 'A',
    main: {
      system: 'swiss',
      teams: [{ title: 'Adapter A1' }, { title: 'Adapter A2' }],
      games: [],
      preferences: { maxScore: 13, fieldsStart: 1 },
    },
    tournamentB: {
      system: 'swiss',
      isTournamentB: true,
      teams: [{ title: 'Adapter B1' }, { title: 'Adapter B2' }],
      games: [],
      preferences: { maxScore: 13, fieldsStart: 4 },
    },
  };
}

function legacyRecord(name = 'Adapter Legacy Cup') {
  return {
    name,
    date: '2025-07-06',
    tournamentMessage: 'Legacy root message',
    activeGroup: 'A',
    system: 'swiss',
    teams: [{ title: 'Legacy A1' }, { title: 'Legacy A2' }],
    games: [],
    preferences: { maxScore: 13, fieldsStart: 2 },
    groupB: {
      teams: [{ title: 'Legacy B1' }, { title: 'Legacy B2' }],
      games: [],
    },
  };
}

async function useEnglish(page) {
  await page.addInitScript(() => localStorage.setItem('petanqueDrawLang', 'en'));
}

async function updateOrganizerMessage(page, message) {
  await page.locator('.remote-toolbar__btn').nth(1).click();
  const textarea = page.locator('.remote-toolbar__textarea');
  await textarea.fill(message);
  await page.waitForTimeout(500);
}

test.describe('canonical tournament record adapter', () => {
  test.beforeAll(async () => cleanupTask03Fixtures());
  test.afterAll(async () => cleanupTask03Fixtures());

  test('new wrapper keeps A/B writes isolated and renders through Public and TV', async ({ page }) => {
    const id = createFixtureId(10);
    const fixture = await seedOwnedTournament(id, newFormatRecord());
    await useEnglish(page);

    try {
      await login(page);
      await page.goto(`/#/?t=${id}`);
      await expect(page.locator('[data-testid="tournament-name-row"]')).toContainText('Adapter Wrapper Cup');
      await expect(page.locator('#table-list')).toContainText('Adapter A1');

      const switcher = page.locator('.remote-toolbar .group-switcher');
      await expect(switcher).toBeVisible();
      await switcher.locator('.group-switcher__btn').nth(1).click();
      await expect(page.locator('#table-list')).toContainText('Adapter B1');

      await page.locator('[data-testid="input-team-title"]').fill('Adapter B Added');
      await page.locator('[data-testid="btn-add-team"]').click();
      await expect(page.locator('#table-list')).toContainText('Adapter B Added');
      await expect
        .poll(async () => (await readOwnedTournament(id))?.tournamentB?.teams?.map((team) => team.title))
        .toContain('Adapter B Added');
      await page.reload();
      await expect(switcher.locator('.group-switcher__btn--active')).toContainText('Tournament B');
      await expect(page.locator('#table-list')).toContainText('Adapter B Added');

      await switcher.locator('.group-switcher__btn').first().click();
      await expect(page.locator('#table-list')).toContainText('Adapter A1');
      await expect(page.locator('#table-list')).not.toContainText('Adapter B Added');

      await page.goto(`/#/tournament?ref=${fixture.ref}`);
      await expect(page.locator('.tournament-title-wrapper')).toContainText('Adapter Wrapper Cup');
      await expect(page.locator('.tournament-info-message')).toContainText('Wrapper root message');
      await page.locator('.tournament-nav__btn--teams').click();
      await expect(page.locator('#table-list')).toContainText('Adapter A1');
      await page.locator('.group-switcher .group-switcher__btn').nth(1).click();
      await expect(page.locator('#table-list')).toContainText('Adapter B1');

      await page.goto(`/#/tv?ref=${fixture.ref}`);
      await expect(page.locator('.tv__tournament-name')).toContainText('Adapter Wrapper Cup');
      await expect(page.locator('.tv__system-message')).toContainText('Wrapper root message');
      await expect(page.locator('.tv__registration-teams')).toContainText('2');

      const stored = await readOwnedTournament(id);
      expect(stored.main.teams.map((team) => team.title)).not.toContain('Adapter B Added');
      expect(stored.tournamentB.teams.map((team) => team.title)).toContain('Adapter B Added');
    } finally {
      await cleanupOwnedTournament(id);
    }
  });

  test('legacy root and groupB remain readable, writable, and root-shaped after reload', async ({ page }) => {
    const id = createFixtureId(20);
    const fixture = await seedOwnedTournament(id, legacyRecord());
    await useEnglish(page);

    try {
      await login(page);
      await page.goto(`/#/?t=${id}`);
      await expect(page.locator('[data-testid="tournament-name-row"]')).toContainText('Adapter Legacy Cup');
      await expect(page.locator('#table-list')).toContainText('Legacy A1');

      await updateOrganizerMessage(page, 'Legacy updated safely');
      await expect.poll(async () => (await readOwnedTournament(id))?.tournamentMessage).toBe('Legacy updated safely');
      await page.reload();
      await page.locator('.remote-toolbar__btn').nth(1).click();
      await expect(page.locator('.remote-toolbar__textarea')).toHaveValue('Legacy updated safely');

      const adminSwitcher = page.locator('.remote-toolbar .group-switcher');
      await adminSwitcher.locator('.group-switcher__btn').nth(1).click();
      await expect(page.locator('#table-list')).toContainText('Legacy B1');

      await page.goto(`/#/tournament?ref=${fixture.ref}`);
      await page.locator('.tournament-nav__btn--teams').click();
      await expect(page.locator('#table-list')).toContainText('Legacy A1');
      await page.locator('.group-switcher .group-switcher__btn').nth(1).click();
      await expect(page.locator('#table-list')).toContainText('Legacy B1');

      const stored = await readOwnedTournament(id);
      expect(stored).not.toHaveProperty('main');
      expect(stored.tournamentMessage).toBe('Legacy updated safely');
      expect(stored.groupB.teams[0].title).toBe('Legacy B1');
    } finally {
      await cleanupOwnedTournament(id);
    }
  });

  test('archive restore preserves wrapper (envelope) Firebase shape', async ({ page }) => {
    test.setTimeout(60_000);
    const wrapperId = createFixtureId(30);
    await seedOwnedTournament(wrapperId, newFormatRecord('Archived Wrapper Adapter'), { status: 'archived' });
    await useEnglish(page);

    try {
      await login(page);
      await page.locator('[data-testid="tournament-name-row"]').waitFor({ state: 'visible' });
      await page.goto('/#/archived');
      await expect(page.locator('.archived-layout')).toBeVisible();

      const archivedItem = page.locator(`.archived-sidebar__item[data-tournament-id="${wrapperId}"]`);
      await expect(archivedItem).toBeVisible({ timeout: 10_000 });
      await expect(archivedItem).toContainText('Archived Wrapper Adapter');
      await archivedItem.click();
      await expect(page.locator('.archived-sidebar__actions')).toBeVisible();
      await page.locator('.btn-make-active').first().click();
      await expect.poll(async () => (await readUserMapEntry(wrapperId))?.status, { timeout: 10_000 }).toBe('active');
      const stored = await readOwnedTournament(wrapperId);
      expect(stored).toHaveProperty('main');
    } finally {
      await cleanupOwnedTournament(wrapperId);
    }
  });

  test('archive restore preserves legacy (root) Firebase shape', async ({ page }) => {
    test.setTimeout(60_000);
    const legacyId = createFixtureId(40);
    await seedOwnedTournament(legacyId, legacyRecord('Archived Legacy Adapter'), { status: 'archived' });
    await useEnglish(page);

    try {
      await login(page);
      await page.locator('[data-testid="tournament-name-row"]').waitFor({ state: 'visible' });
      await page.goto('/#/archived');
      await expect(page.locator('.archived-layout')).toBeVisible();

      const archivedItem = page.locator(`.archived-sidebar__item[data-tournament-id="${legacyId}"]`);
      await expect(archivedItem).toBeVisible({ timeout: 10_000 });
      await expect(archivedItem).toContainText('Archived Legacy Adapter');
      await archivedItem.click();
      await expect(page.locator('.archived-sidebar__actions')).toBeVisible();
      await page.locator('.btn-make-active').first().click();
      await expect.poll(async () => (await readUserMapEntry(legacyId))?.status, { timeout: 10_000 }).toBe('active');
      const stored = await readOwnedTournament(legacyId);
      expect(stored).not.toHaveProperty('main');
    } finally {
      await cleanupOwnedTournament(legacyId);
    }
  });

  test('shared tournament reads and writes continue to use the owner path', async ({ page }) => {
    const id = createFixtureId(50);
    const fixture = await seedSharedTournament(id, newFormatRecord('Shared Adapter Cup'));
    await useEnglish(page);

    try {
      await login(page);
      await page.goto(`/#/?t=${id}`);
      await expect(page.locator('[data-testid="tournament-name-row"]')).toContainText('Shared Adapter Cup');
      await expect(page.locator('#table-list')).toContainText('Adapter A1');

      await updateOrganizerMessage(page, 'Shared owner-path update');
      await expect
        .poll(async () => (await readSharedTournament(fixture.ownerUid, id))?.tournamentMessage)
        .toBe('Shared owner-path update');
      await expect(page.locator('[data-testid="tournament-name-row"]')).toContainText('Shared Adapter Cup');
    } finally {
      await cleanupSharedTournament(fixture.ownerUid, id);
    }
  });
});
