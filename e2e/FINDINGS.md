# E2E Test Findings

Bugs and issues discovered during Playwright e2e test development.

---

## 1. Swiss system requires minimum 5 teams

**Severity:** Low (UI validation works correctly)
**Location:** `src/components/Tournament.vue` ~line 439

When attempting to draw the first round with fewer than 5 teams in Swiss mode, the app shows an error and refuses to proceed. The minimum is 5 teams, not 4. This is correct behavior but undocumented — the UI allows adding 4 teams and selecting Swiss without warning until the draw button is clicked.

**Steps:**

1. Add 4 teams
2. Keep Swiss system selected (default)
3. Click "Draw first round"
4. Error appears, round is not drawn

---

## 2. Stale Firebase cadrage preference leaks between tournaments

**Severity:** Medium
**Location:** `src/components/Tournament.vue` — preferences persistence

When a tournament with cadrage enabled is deleted, the `withCadrage: true` preference can persist in Firebase for the next tournament created in the same slot. This causes unexpected cadrage screens to appear in tournaments that didn't explicitly enable cadrage.

**Steps:**

1. Create tournament with 8 teams, enable playoff + cadrage
2. Play through swiss rounds
3. Delete tournament
4. Create new tournament with 8 teams, enable playoff only (no cadrage)
5. Play through swiss rounds, click "Go to Playoff"
6. **Bug:** Cadrage screen appears instead of going directly to playoff

**Workaround (implemented in tests):** The `enablePlayOff()` helper explicitly unchecks the cadrage checkbox after enabling playoff to ensure clean state.

---

## 3. Tournament B (Group B) switches active tournament on creation

**Severity:** Low (intended behavior, but non-obvious)
**Location:** `src/stores/main.js` — `startPlayOff()` action

When playoff is started with "Play B" enabled, the app creates a new "Group B" tournament AND immediately switches the UI to display it. This means after clicking "Go to Playoff," the user sees the Group B tournament name, not the playoff bracket of the original tournament.

**Steps:**

1. Create 8-team tournament with playoff (top 4) + Play B enabled
2. Play 3 rounds of swiss
3. Click "Go to Playoff"
4. **Result:** UI switches to show "Group B" tournament (containing the eliminated teams)
5. The original tournament's playoff is created but not displayed

**Note:** This appears to be intended UX — the Group B tournament needs setup next.

---

## 4. Login error `data-testid` was missing on password error element

**Severity:** Low (fixed)
**Location:** `src/components/Draw.vue` line 63

The `data-testid="login-error"` attribute was only present on the email validation error `<p>` tag. When Firebase returns an auth error for wrong password, the error message renders in the password field's error paragraph which lacked the testid.

**Fix:** Added `data-testid="login-error"` to both password and confirm password error `<p>` elements.

---

## 5. Restore round requires confirmation modal (not documented in UI flow)

**Severity:** Low (correct behavior)
**Location:** `src/components/partials/Games.vue`

Clicking "Restore round" does not immediately restore — it shows a confirmation modal with a danger button. The round is only restored after confirming. This is good UX but wasn't obvious from the component code alone.

**Steps:**

1. Start tournament, draw round, save results
2. Click "Restore round" link
3. Confirmation modal appears with danger-styled button
4. Click confirm to actually restore

---

## Test Coverage Summary

| Module                | Tests  | Status                    |
| --------------------- | ------ | ------------------------- |
| Auth                  | 3      | 2 pass, 1 skip (register) |
| Swiss System          | 11     | All pass                  |
| Supermele             | 4      | All pass                  |
| Groups (Round-Robin)  | 2      | All pass                  |
| Tournament Management | 4      | All pass                  |
| **Total**             | **24** | **23 pass, 1 skip**       |

Full suite runs in ~1.8 minutes with serial execution (1 worker).
