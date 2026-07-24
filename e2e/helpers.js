const TEST_EMAIL = 'e2e-test-petanque@mailinator.com';
const TEST_PASSWORD = 'TestPass123!';

// --- Auth flows ---

async function login(page) {
  await page.goto('/#/');
  const emailInput = page.locator('[data-testid="input-email"]');
  const teamInput = page.locator('[data-testid="input-team-title"]');
  const prefsBtn = page.locator('[data-testid="btn-preferences"]');
  await emailInput.or(teamInput).or(prefsBtn).first().waitFor({ state: 'visible' });
  if (!(await emailInput.isVisible().catch(() => false))) return;
  await emailInput.fill(TEST_EMAIL);
  await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
  await dismissModals(page);
  await page.locator('[data-testid="btn-submit"]').click();
  await page.locator('[data-testid="input-email"]').waitFor({ state: 'hidden', timeout: 10000 });
}

async function register(page) {
  await page.goto('/#/');
  const toggleLink = page.locator('[data-testid="link-toggle-auth"]');
  if (await toggleLink.isVisible()) await toggleLink.click();
  await page.locator('[data-testid="input-email"]').fill(TEST_EMAIL);
  await page.locator('[data-testid="input-password"]').fill(TEST_PASSWORD);
  await page.locator('[data-testid="input-password-confirm"]').fill(TEST_PASSWORD);
  await page.locator('[data-testid="btn-submit"]').click();
  await page.locator('[data-testid="tournament-name-row"]').waitFor({ state: 'visible' });
}

// --- Tournament setup flows ---

async function ensureCleanTournament(page) {
  await login(page);
  await dismissModals(page);
  const teamInput = page.locator('[data-testid="input-team-title"]');
  const deleteSetup = page.locator('[data-testid="btn-delete-setup"]');
  const prefsBtn = page.locator('[data-testid="btn-preferences"]');
  const confirmBtn = page.locator('[data-testid="btn-confirm-remove"]');
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(500);
    await teamInput.or(prefsBtn).first().waitFor({ state: 'visible' });
    if (await deleteSetup.isVisible().catch(() => false)) {
      await deleteSetup.click();
      await confirmBtn.waitFor({ state: 'visible' });
      await confirmBtn.click();
      await confirmBtn.waitFor({ state: 'hidden' });
      await dismissModals(page);
      continue;
    }
    if (await prefsBtn.isVisible().catch(() => false)) {
      await dismissModals(page);
      await prefsBtn.click({ force: true });
      const removeBtn = page.locator('[data-testid="btn-remove-tournament"]');
      const opened = await removeBtn
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (!opened) {
        await page
          .locator('.modal-close')
          .click()
          .catch(() => {});
        await page.goto('/#/');
        continue;
      }
      await removeBtn.click();
      await confirmBtn.waitFor({ state: 'visible' });
      await confirmBtn.click();
      await confirmBtn.waitFor({ state: 'hidden' });
      await dismissModals(page);
      continue;
    }
    return;
  }
  await teamInput.waitFor({ state: 'visible' });
}

async function addTeams(page, count) {
  const input = page.locator('[data-testid="input-team-title"]');
  const btn = page.locator('[data-testid="btn-add-team"]');
  await input.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  for (let i = 1; i <= count; i++) {
    await input.fill(`T${i}_${Math.random().toString(36).slice(2, 6)}`);
    await btn.click();
  }
  await page.locator(`#table-list tr:nth-child(${count})`).waitFor({ state: 'visible' });
}

async function importTeamsFromPortal(page, portalId) {
  await page.locator('[data-testid="input-portal-id"]').fill(String(portalId));
  await page.locator('[data-testid="btn-import-portal"]').click();
  await page.locator('table tr td').first().waitFor({ state: 'visible' });
}

async function selectSystem(page, system) {
  const radio = page.locator(`[data-testid="radio-system-${system}"]`);
  await radio.waitFor({ state: 'visible' });
  await radio.click();
}

async function enablePlayOff(page) {
  const checkbox = page.locator('[data-testid="checkbox-playoff"]');
  if (!(await checkbox.isChecked())) await checkbox.click();
  await page.locator('[data-testid="select-playoff-teams"]').waitFor({ state: 'visible' });
  const cadrage = page.locator('[data-testid="checkbox-cadrage"]');
  if (await cadrage.isChecked()) await cadrage.click();
}

async function enableCadrage(page) {
  const checkbox = page.locator('[data-testid="checkbox-cadrage"]');
  if (!(await checkbox.isChecked())) await checkbox.click();
}

async function enablePlayB(page) {
  const checkbox = page.locator('[data-testid="checkbox-play-b"]');
  if (!(await checkbox.isChecked())) await checkbox.click();
}

async function setPlayOffTeams(page, count) {
  await page.locator('[data-testid="select-playoff-teams"]').selectOption(String(count));
}

async function setTeamsInGroup(page, count) {
  await page.locator('[data-testid="select-teams-in-group"]').selectOption(String(count));
}

// --- Game flows ---

async function drawFirstRound(page) {
  const drawBtn = page.locator('[data-testid="btn-draw-first-round"]');
  await drawBtn.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  const gameRow = page.locator('[data-testid="game-row"]').first();
  for (let attempt = 0; attempt < 5; attempt++) {
    await drawBtn.click();
    const appeared = await gameRow
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (appeared) return;
    if (!(await drawBtn.isVisible().catch(() => false))) {
      await gameRow.waitFor({ state: 'visible', timeout: 10000 });
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error('drawFirstRound: game rows did not appear after 5 attempts');
}

async function fillScores(page) {
  await page.locator('[data-testid="game-row"]').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(200);
  await page.locator('[data-testid="game-row"]').first().waitFor({ state: 'visible', timeout: 5000 });
  await page.evaluate(() => {
    document.querySelectorAll('input[id^="team_"]').forEach((input) => {
      input.value = 13;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.querySelectorAll('input[id^="opponent_"]').forEach((input) => {
      input.value = Math.floor(Math.random() * 13);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

async function saveResults(page) {
  await page.locator('[data-testid="btn-finish-round"]').click();
  await page
    .locator(
      '[data-testid="link-draw-next-round"], [data-testid="btn-go-playoff"], [data-testid="btn-finish-tournament"], [data-testid="link-play-next-circle"]',
    )
    .first()
    .waitFor({ state: 'visible' });
}

async function playRound(page) {
  await fillScores(page);
  await saveResults(page);
}

async function drawNextRound(page) {
  await page.locator('[data-testid="link-draw-next-round"]').click();
  await page.locator('[data-testid="game-row"]').first().waitFor({ state: 'visible' });
}

async function playMultipleRounds(page, rounds) {
  for (let i = 0; i < rounds; i++) {
    await drawNextRound(page);
    await playRound(page);
  }
}

async function playNextCircle(page) {
  const link = page.locator('[data-testid="link-play-next-circle"]');
  await link.waitFor({ state: 'visible' });
  await link.click();
  const gameRow = page.locator('[data-testid="game-row"]').first();
  const drawNextLink = page.locator('[data-testid="link-draw-next-round"]');
  await gameRow.or(drawNextLink).first().waitFor({ state: 'visible', timeout: 15000 });
  if (await drawNextLink.isVisible().catch(() => false)) {
    await drawNextLink.click();
    await gameRow.waitFor({ state: 'visible', timeout: 10000 });
  }
}

// --- Transition flows ---

async function goToPlayOff(page, { playOffTeams, cadrage, playB } = {}) {
  await page.locator('[data-testid="btn-go-playoff"]').click();
  await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
  if (playOffTeams) {
    await page.locator('[data-testid="confirm-playoff-teams"]').selectOption(String(playOffTeams));
  }
  if (cadrage === true) {
    const cb = page.locator('[data-testid="confirm-cadrage"]');
    if (!(await cb.isChecked())) await cb.click();
  } else if (cadrage === false) {
    const cb = page.locator('[data-testid="confirm-cadrage"]');
    if (await cb.isChecked()) await cb.click();
  }
  if (playB === true) {
    const cb = page.locator('[data-testid="confirm-play-b"]');
    if (!(await cb.isChecked())) await cb.click();
  } else if (playB === false) {
    const cb = page.locator('[data-testid="confirm-play-b"]');
    if (await cb.isChecked()) await cb.click();
  }
  await page.locator('[data-testid="btn-confirm-playoff"]').click();
  if (playB) {
    await page.locator('.group-switcher').waitFor({ state: 'visible', timeout: 10000 });
  } else {
    await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible' });
  }
}

async function goToCadrage(page) {
  await page.locator('[data-testid="btn-go-playoff"]').click();
  await page.locator('[data-testid="playoff-confirm-modal"]').waitFor({ state: 'visible' });
  await page.locator('[data-testid="btn-confirm-playoff"]').click();
  await page.locator('[data-testid="cadrage-heading"]').waitFor({ state: 'visible' });
}

async function fillCadrageScores(page) {
  await page.evaluate(() => {
    document.querySelectorAll('input[id^="team_"]').forEach((input) => {
      input.value = 13;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.querySelectorAll('input[id^="opponent_"]').forEach((input) => {
      input.value = Math.floor(Math.random() * 13);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

async function saveCadrageAndStartPlayOff(page) {
  await page.locator('[data-testid="btn-save-cadrage"]').click();
  await page.locator('[data-testid="playoff-wrapper"]').waitFor({ state: 'visible' });
}

async function fillPlayoffScores(page) {
  await page.locator('[data-testid="game-row"]').first().waitFor({ state: 'visible' });
  await page.evaluate(() => {
    document.querySelectorAll('input[id^="team_"]').forEach((input) => {
      input.value = 13;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.querySelectorAll('input[id^="opponent_"]').forEach((input) => {
      input.value = Math.floor(Math.random() * 13);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

async function savePlayoffResults(page) {
  await page.locator('[data-testid="btn-save-playoff"]').click();
}

async function playPlayoffRound(page) {
  await fillPlayoffScores(page);
  await savePlayoffResults(page);
}

async function playEntirePlayoff(page) {
  const heading = page.locator('[data-testid="playoff-stage-heading"]');
  await heading.waitFor({ state: 'visible' });
  while (await heading.isVisible().catch(() => false)) {
    await playPlayoffRound(page);
    await page.waitForTimeout(300);
  }
  await page.locator('[data-testid="finished-banner"]').waitFor({ state: 'visible' });
}

async function clickFinishTournament(page) {
  await page.locator('[data-testid="btn-finish-tournament"]').click();
  await page.locator('[data-testid="btn-confirm-finish"]').click();
  await page.locator('[data-testid="finished-banner"]').waitFor({ state: 'visible' });
}

// --- Cleanup flows ---

async function dismissModals(page) {
  const modal = page.locator('.modal-background');
  if (await modal.isVisible().catch(() => false)) {
    await modal.click({ force: true });
    await page.waitForTimeout(200);
  }
}

async function waitForStableState(page) {
  await page
    .locator('[data-testid="input-team-title"], [data-testid="tournament-name-row"], [data-testid="game-row"]')
    .first()
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => {});
}

async function deleteCurrentTournament(page) {
  await dismissModals(page);
  await page.waitForTimeout(500);
  const teamInput = page.locator('[data-testid="input-team-title"]');
  const deleteSetup = page.locator('[data-testid="btn-delete-setup"]');
  const prefsBtn = page.locator('[data-testid="btn-preferences"]');
  const tirDelete = page.locator('.bottom-actions__btn--danger');
  const confirmBtn = page.locator('[data-testid="btn-confirm-remove"]');
  await teamInput.or(prefsBtn).or(tirDelete).first().waitFor({ state: 'visible' });
  if (await tirDelete.isVisible().catch(() => false)) {
    await tirDelete.click();
    await confirmBtn.waitFor({ state: 'visible' });
    await confirmBtn.click();
    await confirmBtn.waitFor({ state: 'hidden' });
    await dismissModals(page);
    return true;
  }
  if (await deleteSetup.isVisible().catch(() => false)) {
    await deleteSetup.click();
    await confirmBtn.waitFor({ state: 'visible' });
    await confirmBtn.click();
    await confirmBtn.waitFor({ state: 'hidden' });
    await dismissModals(page);
    return true;
  }
  if (await prefsBtn.isVisible().catch(() => false)) {
    await dismissModals(page);
    await prefsBtn.click({ force: true });
    const removeBtn = page.locator('[data-testid="btn-remove-tournament"]');
    const opened = await removeBtn
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      await page
        .locator('.modal-close')
        .click()
        .catch(() => {});
      return false;
    }
    await removeBtn.click();
    await confirmBtn.waitFor({ state: 'visible' });
    await confirmBtn.click();
    await confirmBtn.waitFor({ state: 'hidden' });
    await dismissModals(page);
    return true;
  }
  return false;
}

async function deleteAllTournaments(page) {
  for (let i = 0; i < 12; i++) {
    await page.goto('/#/');
    await page.waitForTimeout(500);
    const teamInput = page.locator('[data-testid="input-team-title"]');
    const deleteSetup = page.locator('[data-testid="btn-delete-setup"]');
    const prefsBtn = page.locator('[data-testid="btn-preferences"]');
    await teamInput.or(prefsBtn).first().waitFor({ state: 'visible' });
    if (await teamInput.isVisible().catch(() => false)) {
      if (!(await deleteSetup.isVisible().catch(() => false))) return;
    }
    const deleted = await deleteCurrentTournament(page);
    if (!deleted) continue;
  }
}

export {
  TEST_EMAIL,
  TEST_PASSWORD,
  register,
  login,
  ensureCleanTournament,
  addTeams,
  importTeamsFromPortal,
  selectSystem,
  enablePlayOff,
  enableCadrage,
  enablePlayB,
  setPlayOffTeams,
  setTeamsInGroup,
  drawFirstRound,
  fillScores,
  saveResults,
  drawNextRound,
  playRound,
  playMultipleRounds,
  playNextCircle,
  goToPlayOff,
  goToCadrage,
  fillCadrageScores,
  saveCadrageAndStartPlayOff,
  fillPlayoffScores,
  savePlayoffResults,
  playPlayoffRound,
  playEntirePlayoff,
  clickFinishTournament,
  dismissModals,
  deleteCurrentTournament,
  deleteAllTournaments,
};
