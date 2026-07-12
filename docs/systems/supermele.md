# Supermele

Social/fun format. Individual players register alone. Teams are reformed EVERY round using balanced pairing.

## How It Works

- Players are individual participants (not fixed teams)
- **Round 1**: fully random team formation
- **Round 2+**: balanced pairing — strongest player paired with weakest (by wins), equalizing team strength each round
- The app calculates the optimal doubles/triples mix to include everyone
- Tracks which players were teammates to avoid repeats

## Balanced Pairing (Round 2+)

Players are sorted by wins (then by point difference). Teams are formed by pairing from opposite ends:
- Doubles: top player + bottom player
- Triples: top player + middle player + bottom player

This ensures fair, competitive games every round. The "no repeat teammates" constraint is still enforced — if the ideal partner was already a teammate, the algorithm picks the next best candidate.

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
