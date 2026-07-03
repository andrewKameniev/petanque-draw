# E2E Tests (Playwright)

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Tests

```bash
# Run all e2e tests (headless)
npm run e2e

# Run with browser visible
npm run e2e:headed

# Run with Playwright UI (interactive)
npm run e2e:ui

# Run specific test file
npx playwright test e2e/swiss.spec.js

# Run specific test by name
npx playwright test -g "8 teams — swiss + cadrage"
```


## Test Account

Tests use a shared Firebase test account:

- Email: `e2e-test-petanque@mailinator.com`
- Password: `TestPass123!`

The `auth.spec.js` registers this account on first run. Subsequent runs login with it.

## Test Structure

### auth.spec.js

- Register new user
- Login with correct credentials
- Login with wrong password (error handling)

### swiss.spec.js

Swiss system tournaments with various configurations:

- 4 teams (uses supermele since Swiss needs 5+)
- 8 teams — plain swiss, finish without playoff
- 8 teams — swiss + playoff (top 4, no cadrage)
- 8 teams — swiss + cadrage + playoff (top 4)
- 16 teams — swiss + playoff (top 8)
- 16 teams — swiss + cadrage + playoff (top 8)
- 40 teams — swiss + playoff (top 16)
- 40 teams — swiss + cadrage + playoff (top 16)
- Swiss round limit enforcement (cannot draw beyond N/2)

### groups.spec.js

Round-robin (groups) system:

- 8 teams — 2 groups of 4, full round-robin, finish
- 16 teams — 4 groups of 4
- 8 teams — groups → playoff via ranking tab

### supermele.spec.js

Supermele (random team formation):

- 8 players — doubles, 3 rounds
- 9 players — triples, 3 rounds
- 16 players — doubles, 4 rounds
- Adding players mid-tournament

### tournament-management.spec.js

General tournament management:

- Create and delete empty tournament
- 10-tournament limit enforcement
- Inline rename
- Restore round (once only)
- Delete from preferences (modal closes)
- Pin/unpin tournament

## Important: Cleanup

Every test MUST delete its tournament after completion. This prevents hitting the 10-tournament Firebase limit and ensures tests are independent.

Pattern:

```javascript
test('my test', async ({ page }) => {
  // ... do test work ...
  await deleteCurrentTournament(page);
});
```

## Helpers (e2e/helpers.js)

| Function                           | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `register(page)`                   | Register test account                               |
| `login(page)`                      | Login with test credentials                         |
| `ensureLoggedIn(page)`             | Login if not already authenticated                  |
| `addTeams(page, count)`            | Add N teams with generated names                    |
| `selectSystem(page, system)`       | Choose swiss/groups/supermele                       |
| `drawFirstRound(page)`             | Click "Draw first round" button                     |
| `fillRandomScores(page)`           | Fill all score inputs with random valid scores      |
| `saveResults(page)`                | Click save results                                  |
| `drawNextRound(page)`              | Click the "Draw N round" link                       |
| `playRound(page)`                  | Fill scores + save (one round)                      |
| `playMultipleRounds(page, n)`      | Draw + play N additional rounds                     |
| `goToPlayOff(page)`                | Click "Go Playoff" bottom button                    |
| `clickFinishTournament(page)`      | Click "Finish Tournament"                           |
| `enablePlayOff(page)`              | Check playoff checkbox in setup                     |
| `enableCadrage(page)`              | Check cadrage checkbox                              |
| `setPlayOffTeams(page, n)`         | Select playoff team count                           |
| `fillCadrageScores(page)`          | Fill cadrage game scores                            |
| `saveCadrageAndStartPlayOff(page)` | Save cadrage → auto starts playoff                  |
| `deleteTournament(page)`           | Delete via preferences                              |
| `deleteCurrentTournament(page)`    | Delete (tries empty button first, then preferences) |
| `deleteAllTournaments(page)`       | Delete all tournaments (cleanup)                    |
