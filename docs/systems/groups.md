# Groups (Round-Robin)

Teams split into groups. Within each group, everyone plays everyone (full round-robin).

## Group Formation

- With rating: snake distribution (1,4,5,8 in group A; 2,3,6,7 in group B) — ensures balanced groups
- Without rating: random distribution
- Special 2-group scheme for <33 teams using tournament-bracket-style distribution

## Scheduling (Circle Method)

Position 0 is fixed, all others rotate. For N teams in a group, there are N-1 rounds (or N rounds if odd, with one bye per round).

## Ranking Within Group

```
wins > directWins > directPoints > (pointsPlus - pointsMinus)
```

**Direct encounters:** When 2+ teams are tied on wins, only their head-to-head results matter:

- `directWins`: How many of the other tied teams this team beat directly
- `directPoints`: Point difference in games between tied teams only

## Editing Previous Round Results

Admins can edit match results from any completed round via the Results tab (pencil icon). After saving:

- The game score and winner are updated
- All team stats (wins, points scored/conceded) are reset and recalculated from scratch across all rounds
- Standings are immediately reflected in both admin and public views
- The schedule is unaffected since all matches are pre-generated

## After Groups

Top N teams from each group advance to [Playoff](./playoff.md) or [Cadrage](./cadrage.md).

## See also

- [Ranking Algorithms](../ranking-algorithms.md)
