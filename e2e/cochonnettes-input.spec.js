import { test, expect } from '@playwright/test';
import { ensureCleanTournament, addTeams, drawFirstRound, deleteCurrentTournament } from './helpers';

async function enableCochonettes(page) {
  const toggle = page.locator('.setup-card__collapse-toggle');
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  const checkbox = page.locator('[data-testid="checkbox-cochonettes"]');
  await checkbox.scrollIntoViewIfNeeded();
  await checkbox.check();
}

test.describe('Cochonnettes score input', () => {
  test.beforeEach(async ({ page }) => {
    await ensureCleanTournament(page);
  });

  test('auto-blur fires on normal score increment', async ({ page }) => {
    await addTeams(page, 8);
    await enableCochonettes(page);
    await drawFirstRound(page);

    const input = page.locator('input[id="team_0"]');
    await input.focus();
    await input.fill('3');
    await expect(input).not.toBeFocused();
    await deleteCurrentTournament(page);
  });

  test('no premature blur when correcting score from higher to multi-digit', async ({ page }) => {
    await addTeams(page, 8);
    await enableCochonettes(page);
    await drawFirstRound(page);

    const input = page.locator('input[id="team_0"]');

    // Set initial score to 7 via normal cochonnette flow
    await input.focus();
    await input.fill('7');
    // auto-blur fires (7 > 0)
    await expect(input).not.toBeFocused();

    // Now correct 7 → 11: focus, clear, type "1", then "1" again
    await input.focus();
    expect(await input.inputValue()).toBe('7');
    await input.fill('');
    await input.pressSequentially('1');
    // Should still be focused — user is mid-correction (cleared from 7)
    await expect(input).toBeFocused();

    await input.pressSequentially('1');
    // Value is now 11, still focused because _wasCleared was set
    await expect(input).toBeFocused();
    expect(await input.inputValue()).toBe('11');

    await deleteCurrentTournament(page);
  });

  test('no premature blur when typing 13 after clearing a lower score', async ({ page }) => {
    await addTeams(page, 8);
    await enableCochonettes(page);
    await drawFirstRound(page);

    const input = page.locator('input[id="team_0"]');

    // Set initial score to 5
    await input.focus();
    await input.fill('5');
    await expect(input).not.toBeFocused();

    // Correct 5 → 13
    await input.focus();
    await input.fill('');
    await input.pressSequentially('13');
    await expect(input).toBeFocused();
    expect(await input.inputValue()).toBe('13');

    await deleteCurrentTournament(page);
  });
});
