# Supermele

Social/fun format. Individual players register alone. Teams are randomly reformed EVERY round.

## How It Works

- Players are individual participants (not fixed teams)
- Each round: shuffle all players into random doubles (2-player) or triples (3-player)
- The app calculates the optimal doubles/triples mix to include everyone
- Tracks which players were teammates to avoid repeats (best-effort, 100 attempts)

## Team Formation Math

For N players with preferred team size P:

- Calculate games needed: `floor(N / P)`
- Adjust mix of doubles/triples until `doubles*2 + triples*3 = N`
- Example: 11 players, prefer doubles → 4 doubles (8) + 1 triple (3) = 11

## Ranking

```
wins > (pointsPlus - pointsMinus) > pointsPlus > rating
```

No Buchholz — meaningless with random teams.

## Lane Assignment

Same algorithm as Swiss but counts ALL individual players' lane history (since "teams" change each round).
