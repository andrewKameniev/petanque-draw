import { test } from '@playwright/test';
import { login, deleteAllTournaments } from './helpers';
test('cleanup', async ({ page }) => {
  test.setTimeout(60000);
  await login(page);
  await deleteAllTournaments(page);
});
