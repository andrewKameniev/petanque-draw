# Tournament Lifecycle

## Phase 1: Setup (Pre-Start)

### Creating a Tournament

- Max 10 active tournaments per user
- Auto-named "Tournament A" through "Tournament J"
- Click name to rename anytime

### Adding Teams

- Manual entry (team name = captain surname typically)
- Import from Ukrainian Federation portal (admin only)
- "Restore last teams" — copies teams from previous tournament stored in localStorage
- Optional: set rating per team (for seeded first-round pairing)

### Configuration

| Setting         | Default | Purpose                                          |
| --------------- | ------- | ------------------------------------------------ |
| System          | Swiss   | Tournament format                                |
| Technical score | 13:7    | Walkover result                                  |
| Max score       | 13      | Game ends at this score (validation)             |
| Fields start    | 1       | First lane number                                |
| Playoff teams   | 8       | How many advance to knockout                     |
| With cadrage    | false   | Add play-in round before playoff                 |
| Tournament B    | false   | Create parallel tournament for non-playoff teams |
| Teams in group  | 4       | (Groups only) group size                         |
| Players in team | 2       | (Supermele only) doubles or triples              |

### Starting

Click "Draw first round" → first round is generated, tournament enters active state.

---

## Phase 2: Active Tournament (Swiss Rounds)

### Round Cycle

```
Draw round → Assign lanes → Enter scores → Save results → Repeat
```

### Drawing a Round

1. Algorithm pairs teams based on current standings
2. Lane assignment algorithm distributes games across fields
3. Games appear on "Current games" tab with lane numbers
4. `roundIsActive = true`

### Entering Scores

- Each game shows two score inputs
- Validation: no ties, no negatives, no scores above max
- All scores must be filled before saving

### Saving Results

1. Validates all scores
2. Parses string inputs to numbers
3. Updates each team's: wins, opponents[], pointsPlus, pointsMinus
4. `roundIsActive = false`
5. Syncs to Firebase

### Restoring a Round

Undo the last saved round. Use when you entered wrong scores after the next round was drawn.

- Requires user confirmation via a danger-styled modal before proceeding
- Can only restore ONCE between new draws (prevents Buchholz corruption)
- Pops last entry from games[], opponents[], lanes[]
- For groups: recalculates all results from scratch

---

## Phase 3: Transition to Playoff

### Option A: "Go Playoff" Button (bottom actions)

Only shows when playoff is configured in preferences. Directly starts cadrage or playoff based on settings.

### Option B: Ranking Tab

Manual control — choose number of playoff teams, toggle cadrage, then click "Go!"

### Option C: "Finish Tournament" Button

Hard stop. No playoff. Tournament ends with Swiss ranking as final result.

---

## Phase 4: Cadrage (if configured)

1. Cadrage games appear on "Current games" tab
2. Each game shows the two bubble teams
3. Enter scores for all cadrage games
4. Click "Save results" inside cadrage section
5. Winners + directly-seeded teams form the playoff bracket
6. Automatically transitions to playoff

---

## Phase 5: Playoff

1. Bracket generated with proper seeding
2. Current stage games shown on "Current games" tab
3. Enter scores per game
4. Winners advance automatically
5. Repeat until final + optional third-place match
6. After final scores entered → tournament finishes

### Viewing

- "Show playoff bracket" button displays visual bracket
- Results tab shows all playoff games grouped by stage
- Public viewers see bracket in real-time

---

## Phase 6: Finished Tournament

### What Happens

- `tournamentIsFinished = true`
- Ranking tab shows final results with places
- Gold/Silver/Bronze highlighting
- "Copy results" — text format for sharing in messengers

### Archiving

- "Archive tournament" saves a snapshot to Firebase `saved/` collection
- Archived tournaments visible in mobile menu and /archived route
- Original active tournament can be deleted after archiving

### Protocol (archive only)

After the finished tournament is archived, its Archive view provides the official protocol preview and export tools. The active finished-tournament view does not expose a separate protocol action.

---

## Public View (Spectators)

Accessible via shareable link. No login required.

### What's Shown

- Tournament status badge (Active / Not started / Finished)
- Organizer message (can be updated live)
- Current round games with lane numbers
- Team list
- Results of all rounds
- Ranking table
- Playoff bracket

### Real-time Updates

Firebase subscription updates the page automatically when organizer makes changes. Reconnects on visibility/online events.

---

## Multi-Tournament Management

- Up to 10 concurrent active tournaments
- Switch between them via navbar dropdown (desktop) or sidebar (mobile)
- Pin a default tournament (loads on login)
- Each tournament has independent state, teams, and public link
