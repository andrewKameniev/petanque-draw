# Tournament B (Group B)

Optional companion bracket for players not advancing to Group A playoff.

## How It Works
When the organizer enables "Tournament B" before starting playoff:
1. After playoff teams are selected, remaining eligible teams are moved into `tournament.groupB`
2. Their stats (wins, opponents, points) are reset
3. Group B lives **inside the same tournament** — an A/B switcher appears in the toolbar
4. The organizer can switch between Group A and Group B data on the same page

## A/B Switcher
- Appears in the `remote-toolbar` to the right of the message button
- Segmented pill: `[ A | B ]`
- Visible only when `tournament.groupB` is non-null
- Switching updates all tabs (Teams, Games, Ranking, Results) to show that group's data
- Public view also shows the switcher

## Data Model
```javascript
tournament.groupB = {
  teams: [],           // Group B teams (stats reset from swiss)
  games: [],           // Group B rounds
  playOff: null,       // Group B playoff bracket
  roundIsActive: false,
  tournamentIsFinished: false,
  eliminationRound: null,
  preferences: { playOffTeams, playOffEnabled, withCadrage, withBarrage, barrageTeams }
}
tournament.activeGroup = 'A' | 'B'
```

## Withdrawal
Before playoff starts, the organizer can mark teams as **withdrawn** (WD). Withdrawn teams:
- Keep their swiss ranking position
- Do NOT proceed to playoff/cadrage/barrage
- Do NOT go to Group B
- Teams below the cutoff "bubble up" to fill vacated spots

## Elimination Round
Group B can start an elimination round to reduce team count before playoff:
- Pairs bottom teams: best-of-pool vs worst-of-pool (e.g. 7v10, 8v9)
- Single knockout round — winners advance, losers eliminated
- Useful when team count doesn't fit a power-of-2 bracket

## Cadrage Losers → Group B
When `cadrageLosersToB` preference is enabled:
- After cadrage games are scored, losers are sent to Group B
- They join existing Group B teams (if any) or create the Group B

## Legacy
Old tournaments with `isGroupB = true` (separate instances) continue to work unchanged.
New Group B creation uses the inline `tournament.groupB` structure.
