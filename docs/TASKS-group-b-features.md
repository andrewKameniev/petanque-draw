# Group B & Playoff Flow Enhancements

Three features to improve the tournament Group B workflow, player management between stages, and elimination mechanics.

---

## Feature 1: Inline Group A/B Switcher

### Current Behavior
When "Also play Tournament B" is enabled, `startPlayOff()` creates a **separate tournament instance** via `addBTournament()`. The organizer must switch between two independent tournaments in the sidebar.

### Desired Behavior
Instead of creating a separate tournament, Group B lives **inside the same tournament** as a parallel bracket. An **A / B toggle switcher** appears in the `remote-toolbar` (to the right of the "Написати повідомлення" button) allowing the organizer to view Group A or Group B data on the same page.

### UI
```
[ Показати посилання ] [ Написати повідомлення ▾ ] [ A | B ]
```
- Segmented control / pill switcher with two options: **A** and **B**
- **B** button only visible when Group B has been activated
- Active group highlighted; switching updates all tabs (Teams, Games, Ranking, Results) to show that group's data
- Remote viewers (public page) also see the switcher

### Data Model Changes
```javascript
tournament.groupB = {
  teams: Team[],        // Group B teams (stats reset)
  games: Round[][],     // Group B rounds
  playOff: Game[],      // Group B playoff bracket (if started)
  playOffBracket: {},
  roundIsActive: Boolean,
  tournamentIsFinished: Boolean,
  system: 'swiss',      // Group B always starts as swiss
  barrage: null,
  cadrage: null,
  preferences: {        // Subset: playOffTeams, playOffEnabled, etc.
    playOffTeams: Number,
    playOffEnabled: Boolean,
    withCadrage: Boolean,
    withBarrage: Boolean,
    barrageTeams: Number,
  }
}
tournament.activeGroup = 'A' | 'B'   // Which group is currently displayed
```

### Implementation Tasks

- [ ] **1.1** Add `groupB` object to `createTournament()` defaults (null initially)
- [ ] **1.2** Add `activeGroup` state field (default `'A'`)
- [ ] **1.3** Refactor `startPlayOff()`: when `playB` is enabled, populate `tournament.groupB` instead of calling `addBTournament()`
- [ ] **1.4** Create `GroupSwitcher.vue` component (segmented A/B control)
- [ ] **1.5** Add switcher to `remote-toolbar` in `Tournament.vue`, visible only when `tournament.groupB` is non-null
- [ ] **1.6** Create computed properties / getters that return current group's data based on `activeGroup`:
  - `activeTeams` — teams for current group
  - `activeGames` — games for current group
  - `activeRankingTeams` — ranking for current group
  - `activePlayOff` — playoff for current group
- [ ] **1.7** Update `Games.vue` to use active group data
- [ ] **1.8** Update `Ranking.vue` to use active group data
- [ ] **1.9** Update `Results.vue` to use active group data
- [ ] **1.10** Update `TeamsList.vue` / `AddTeam.vue` for Group B team management
- [ ] **1.11** Update round drawing (`drawSwissRound`) to work within Group B context
- [ ] **1.12** Update Firebase sync to include `groupB` sub-object
- [ ] **1.13** Update remote/public view to show the A/B switcher
- [ ] **1.14** Remove or deprecate `addBTournament()` / `isGroupB` flag (keep backward compat for existing tournaments)
- [ ] **1.15** Update Protocol export to handle both groups

### Tests
- Unit: `createTournament()` includes `groupB: null` by default
- Unit: Group B population from ranked teams (stats reset, correct slice)
- Unit: `activeGroup` switching returns correct data subset
- E2E: Start tournament → swiss rounds → start playoff with B → switcher appears → switch to B → see B teams → draw B round → switch back to A → see A playoff

---

## Feature 2: Remove Players Before Playoff

### Current Behavior
Once swiss is complete and playoff is triggered, all qualified teams proceed automatically. No option to exclude specific teams.

### Desired Behavior
After swiss rounds are done (before clicking "Go to Playoff"):
- The organizer can **mark teams as withdrawn** from the standings
- Withdrawn teams keep their earned swiss position/rank in the final standings
- They do **not** proceed to cadrage/barrage/playoff
- Teams ranked below the playoff cutoff "bubble up" to fill the vacated spots

### Example
- 16 teams played swiss, top 8 qualify for playoff
- Teams ranked 3rd and 6th are withdrawn
- Now teams ranked 9th and 10th move into the playoff pool
- Final standings still show the withdrawn teams at positions 3 and 6 (marked as WD)

### Data Model Changes
```javascript
// On team object:
team.withdrawn = Boolean  // true = excluded from playoff progression

// In ranking display:
// Withdrawn teams shown with "(WD)" label, grayed out
// Playoff qualification line adjusts to skip withdrawn teams
```

### UI
- In the **Ranking tab**, after swiss is complete (all rounds played, round not active):
  - Each team row shows a small **"x" / remove button** (only visible to admin)
  - Clicking it marks `team.withdrawn = true`
  - Team row gets a visual indicator (strikethrough or muted + "WD" badge)
  - Can be undone (toggle)
- In the **Playoff confirmation modal**:
  - List of qualified teams shown, withdrawn ones excluded
  - Count adjusts: "8 teams to playoff" reflects actual proceeding teams

### Implementation Tasks

- [ ] **2.1** Add `withdrawn` field to team model (default `false`)
- [ ] **2.2** Add `toggleWithdrawn(teamTitle)` action in store
- [ ] **2.3** Update `Ranking.vue`: show withdraw button per team row (when swiss complete, round not active, playoff not started)
- [ ] **2.4** Style withdrawn teams (muted, WD badge, strikethrough)
- [ ] **2.5** Update `setPlayOffList()`: filter out withdrawn teams before slicing for playoff/cadrage/barrage
- [ ] **2.6** Update playoff confirmation modal: show adjusted count, list excludes withdrawn
- [ ] **2.7** Ensure withdrawn teams still appear in final protocol/results at their swiss rank
- [ ] **2.8** Handle edge case: withdrawing a team that was in the playoff cutoff recalculates who qualifies
- [ ] **2.9** Persist `withdrawn` flag in Firebase sync
- [ ] **2.10** Add undo capability (toggle back to `withdrawn = false`)

### Tests
- Unit: `getPlayoffQualifiedTeams()` skips withdrawn teams and picks next in line
- Unit: Ranking still shows withdrawn teams at their earned position
- Unit: Withdrawing N teams → N extra teams qualify from below cutoff
- E2E: Swiss complete → withdraw 2 teams → confirm playoff → verify 9th+10th are in bracket instead

---

## Feature 3: Elimination Extra Round (Group B Reduction)

### Current Behavior
Group B always starts a full swiss tournament from scratch. No way to reduce team count before starting Group B's playoff.

### Desired Behavior
The organizer can start an **elimination round** for Group B to reduce team count to a power of 2 (or any desired number) before playoff. This is a single knockout round for the bottom N teams — winners advance, losers are eliminated.

### Simple Case
- 10 teams in Group B, need 8 for immediate playoff
- Start elimination round: teams at positions 7, 8, 9, 10 play one round (7v10, 8v9)
- Winners (2) join top 6 → 8 teams proceed to playoff

### Complex Case (Cadrage losers → Group B)
- Group A: 20 teams swiss → top 4 direct to playoff, positions 5-12 play cadrage
- Cadrage winners (4) join Group A playoff (8 total)
- **Cadrage losers (4) are sent to Group B** instead of being eliminated
- Group B now has its own teams + cadrage losers, may need elimination round to fit bracket

### Data Model Changes
```javascript
// On tournament.groupB (or tournament if standalone):
tournament.groupB.eliminationRound = {
  games: Game[],           // The elimination games
  qualifiedFrom: Number,   // Position cutoff (e.g., top 6 are safe)
  bracketSize: Number,     // Target size after elimination (e.g., 8)
  completed: Boolean
}

// For cadrage losers → Group B flow:
tournament.preferences.cadrageLosersToB = Boolean  // New preference
```

### UI
- After Group B swiss (or when Group B is populated):
  - Button: **"Start elimination round"** (visible when team count > next power of 2, or always available)
  - Shows: "Teams 7-10 will play elimination. Winners join positions 7-8 for playoff."
  - Organizer can adjust which positions play (e.g., 7-10, or 5-10, or custom)
- Elimination round plays like a normal round (enter scores)
- After completion, losing teams are marked eliminated, winners join the bracket pool

### Implementation Tasks

- [ ] **3.1** Add `eliminationRound` structure to group B data model
- [ ] **3.2** Create `startEliminationRound(fromPosition, bracketSize)` method:
  - Pairs teams: best-vs-worst within the elimination pool (7v10, 8v9)
  - Creates single-round games
- [ ] **3.3** Create `EliminationRound.vue` component (simple game list, score entry)
- [ ] **3.4** Add "Start elimination round" button to Group B Games tab (when round not active, playoff not started)
- [ ] **3.5** After elimination round completes: mark losers as eliminated, rebuild qualified list
- [ ] **3.6** Integrate with playoff start: qualified pool = safe teams + elimination winners
- [ ] **3.7** Add `cadrageLosersToB` preference toggle
- [ ] **3.8** Update `startCadrage()` flow: after cadrage games are scored, losers get sent to Group B
- [ ] **3.9** Handle timing: cadrage losers arrive in Group B mid-tournament or before B starts
- [ ] **3.10** UI for organizer to trigger "send cadrage losers to B" after cadrage completes
- [ ] **3.11** Elimination round results show in protocol

### Tests
- Unit: `startEliminationRound(7, 8)` with 10 teams creates 2 games (7v10, 8v9)
- Unit: After elimination, winners at positions 7-8, losers eliminated
- Unit: Cadrage losers correctly added to Group B teams
- Unit: Elimination pairing is fair (best-of-eliminated vs worst-of-eliminated)
- E2E: 10-team Group B → start elimination for 7-10 → enter scores → 8 teams proceed to playoff
- E2E: Group A cadrage → losers sent to B → B has combined roster

---

## Implementation Order

Recommended sequence (each feature is independently shippable):

1. **Feature 2** (Remove players) — smallest scope, no data model restructuring, immediately useful
2. **Feature 1** (A/B switcher) — significant refactor of Group B storage, but foundation for Feature 3
3. **Feature 3** (Elimination round) — builds on Feature 1's inline Group B structure

---

## Migration Notes

- Existing tournaments with `isGroupB = true` (separate instances) should continue to work
- New Group B creation uses inline `tournament.groupB` structure
- No automatic migration of old tournaments — they remain as separate instances
