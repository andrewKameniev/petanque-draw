# Groups

Teams split into groups. Within each group, teams play either full round-robin or Swiss system rounds.

## Group Format

Two formats available:

- **Round Robin** — everyone plays everyone within the group (default)
- **Swiss System** — Swiss pairing within each group for a configured number of rounds

Swiss format is useful for larger groups (e.g. 16 teams) where full round-robin would require too many rounds.

## Group Formation

- Without rating: random distribution
- With rating: one of three draw methods (see below)
- Special 2-group scheme for <33 teams using tournament-bracket-style distribution

## Draw Methods

Available when team ratings are enabled. Controls how teams are distributed across groups.

### Seeded Draw (default)

Teams are split into rating pots (one pot per group count). Each group gets one team from each pot.

```
4 groups, 16 teams:
Pot 1 (top 4):    → one to each group
Pot 2 (5-8):      → one to each group
Pot 3 (9-12):     → one to each group
Pot 4 (13-16):    → one to each group
```

Best for: transparent draw, keeping top teams separated, preserving "real draw" feeling.

### Snake Seeding

Teams sorted by rating, distributed in alternating direction across groups.

```
4 groups (A, B, C, D):
Row 1 (→):  A=#1, B=#2, C=#3, D=#4
Row 2 (←):  D=#5, C=#6, B=#7, A=#8
Row 3 (→):  A=#9, B=#10, C=#11, D=#12
Row 4 (←):  D=#13, C=#14, B=#15, A=#16
```

Best for: very balanced groups, fast automatic distribution, cases where randomness is less important.

### Balanced Random

Generates 1000 random distributions and selects the one with the smallest difference in total group ratings.

Best for: maximum balance while keeping randomness, avoiding "group of death" scenarios.

## Scheduling (Circle Method)

Position 0 is fixed, all others rotate. For N teams in a group, there are N-1 rounds (or N rounds if odd, with one bye per round).

## Ranking Within Group

### Round Robin format

```
wins > directWins > directPoints > (pointsPlus - pointsMinus)
```

**Direct encounters:** When 2+ teams are tied on wins, only their head-to-head results matter:

- `directWins`: How many of the other tied teams this team beat directly
- `directPoints`: Point difference in games between tied teams only

Displayed as a head-to-head matrix table showing all game results between group members.

### Swiss format

```
wins > buhgolts > smallBuhgolts > (pointsPlus - pointsMinus) > pointsPlus > rating
```

Only within-group opponents count for buchholz calculation. Displayed as a Swiss-style table with Buchholz/Small Buchholz columns.

## Group Switcher (Table Tab)

When a tournament has multiple groups, the ranking tab shows group switcher buttons (Група A, B, C, D) to view one group at a time. The TV dashboard auto-rotates between groups every 12 seconds.

## Editing Previous Round Results

Admins can edit match results from any completed round via the Results tab (pencil icon). After saving:

- The game score and winner are updated
- All team stats (wins, points scored/conceded) are reset and recalculated from scratch across all rounds
- Standings are immediately reflected in both admin and public views
- The schedule is unaffected since all matches are pre-generated

## Ranking Pipeline (`src/services/group-ranking.js`)

All ranking computations are handled by a pure service layer that never mutates input data.

### Status Policy

| System      | Statuses counted in ranking                                           |
| ----------- | --------------------------------------------------------------------- |
| Round-robin | `finished` only — in-progress games are excluded from standings       |
| Swiss       | Uses team-level stats (wins/opponents), not per-game status filtering |
| Poules      | All scored games (any status with non-null scores)                    |
| Barrage     | All scored games from `barrage.startIndex` onward                     |

### Score Conversion

Persisted scores may be strings (legacy data). All scores are converted via `Number()` before accumulation. Games with `null` scores on either side are skipped entirely.

### Tie-Break Order Per System

**Round-robin (regulation):**

```
wins > directWins (h2h) > directPoints (h2h point diff) > overall point difference
```

When 2+ teams are tied, a recursive mini-table of their mutual games is computed.

**Swiss:**

```
wins > buchholz > smallBuchholz > pointDiff > pointsPlus > rating
```

Only within-group opponents count for Buchholz.

**Poules / Barrage (simple):**

```
wins > (pointsPlus - pointsMinus)
```

### Partial-Score Visibility

- **Live ranking (admin view):** Round-robin shows only completed games. Poules/barrage include in-progress scored games.
- **Public view:** Same rules — uses the same service functions.
- **Active round:** Games currently being played do NOT appear in round-robin standings until finished.

## After Groups

Top N teams from each group advance to [Playoff](./playoff.md) or [Cadrage](./cadrage.md).

## See also

- [Ranking Algorithms](../ranking-algorithms.md)
