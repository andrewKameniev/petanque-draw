# Tournament B (Group B)

Optional companion tournament for players eliminated from playoff. Now lives as an inline group within the same tournament (no separate tournament created).

## How It Works

When the organizer enables "Tournament B" before starting playoff:

1. After playoff teams are selected, remaining teams form Group B within the same tournament
2. Their stats (wins, opponents, points) are reset
3. Group B runs as swiss or direct playoff (configurable in the confirm modal)
4. Admin switches between Group A and Group B using the pill-style switcher
5. All tabs (Teams, Games, Ranking, Results) reflect the active group

## Group B Data Structure

```
tournament.activeGroup: 'A' | 'B'
tournament.groupB: {
  teams, games, playOff, playOffBracket, playOffStage,
  cadrage, barrage, eliminationRound,
  roundIsActive, tournamentIsFinished, mode
}
```

## Features

### Group Switcher

Full-width A/B pill toggle appears above tab content when `groupB` exists. Works in both admin and public views.

### Player Withdrawal

Admin can mark teams as "withdrawn" before starting playoff (in the advanced settings of the playoff confirm modal). Withdrawn teams keep their swiss ranking but don't proceed to playoff/cadrage/barrage. Bottom teams "bubble up" to fill their spots.

### Cadrage Losers → Group B

When cadrage is enabled, an option allows cadrage losers to be sent to Group B instead of being fully eliminated. After cadrage finishes, losers are added to the Group B team pool via `addGroupBTeams()`.

### Elimination Round

When Group B has too many teams for a clean power-of-2 bracket, an elimination round reduces the count. Pairs bottom teams (best-vs-worst) in a single knockout. Losers are marked `eliminated` and excluded from playoff.

## Store Architecture

All round/game/playoff actions are group-aware via `_getTarget()`:

- Returns `{ data: tournament.groupB, prefix: 'groupB/' }` when active group is B
- Returns `{ data: tournament, prefix: '' }` when active group is A
- Actions like `startRound`, `endRound`, `addRoundToGames`, `setPlayOff`, etc. automatically route to the correct target

## Firebase Sync

Group B data syncs under `groupB/` prefix. The `syncGameMatch` action routes to `groupB/games/{round}/{game}` when Group B is active. Full Group B state is subscribed as a simple path.
