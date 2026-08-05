# Tournament B (Group B)

Optional companion tournament for players eliminated from playoff. Now lives as an inline group within the same tournament (no separate tournament created).

## How It Works

When the organizer enables "Tournament B" before starting playoff:

1. After playoff teams are selected, remaining teams form Group B within the same tournament
2. Their stats (wins, opponents, points) are reset
3. Group B runs as swiss or direct playoff (configurable in the confirm modal)
4. Admin switches between Group A and Group B using the pill-style switcher
5. All tabs (Teams, Games, Ranking, Results) reflect the active group

## Persisted Group B Data Structures

The current envelope and legacy root formats use different keys. The canonical
adapter in `src/services/tournament-record.js` hides that distinction from UI
consumers.

```
// Current envelope
record.activeGroup: 'A' | 'B'
record.main: CompetitionData
record.tournamentB: {
  teams, games, playOff, playOffBracket, playOffStage,
  cadrage, barrage, eliminationRound,
  roundIsActive, tournamentIsFinished, system, preferences
}

// Legacy root
record.activeGroup: 'A' | 'B'
record.groupB: {
  teams, games, playOff, playOffBracket, playOffStage,
  cadrage, barrage, eliminationRound,
  roundIsActive, tournamentIsFinished, system?, preferences?
}
```

Legacy `groupB` may be partial. Normalization supplies empty competition state
and configuration defaults without copying Group A teams, games, or results.
If B is selected but absent, selection and writes safely fall back to A.

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

All round/game/playoff actions are group-aware via the canonical tournament
record adapter used by `_getTarget()`:

- Envelope A/B prefixes are `main/` and `tournamentB/`
- Legacy A/B prefixes are empty and `groupB/`
- Actions like `startRound`, `endRound`, `addRoundToGames`, `setPlayOff`, etc. automatically route to the correct target

## Firebase Sync

Envelope Group B data syncs under `tournamentB/`; legacy Group B data remains
under `groupB/`. The `syncGameMatch` action routes to the matching
`{prefix}games/{round}/{game}` path. No Firebase migration is performed, and
existing public links, archive ownership paths, and shared-owner paths remain
unchanged.
