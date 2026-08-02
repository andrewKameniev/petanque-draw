# Playoff

The organizer can choose single or double elimination. Single elimination supports power-of-two fields. Double
elimination supports any field size from 2 participants upward and assigns seeded byes up to the next power of two.

## Double Elimination

- Every participant starts in the winners bracket.
- A first loss sends the participant to the losers bracket.
- A loss in the losers bracket eliminates the participant.
- Winners and losers rounds become playable together whenever their dependencies are complete.
- The loser of the Winners' Final enters the Losers' Final.
- The Winners' Final champion and Losers' Final champion play one decisive Grand Final.
- Lower-bracket drops are crossed to reduce immediate rematches.

The bracket viewer shows the complete winners/losers route on one horizontally scrollable canvas. Non-power-of-two
fields give byes to the highest seeds.

## Single Elimination

Standard knockout bracket. Supports 4, 8, 16, 32, 64 teams.

## Seeding

Standard tournament bracket seeding ensures top seeds avoid each other:

- Seed 1 and Seed 2 meet only in the final (opposite halves)
- Seeds 3-4 distributed into quarter-halves
- Uses predefined `BRACKET_ORDERS` for 16+ team brackets

## Bracket Positions (example: 8 teams)

```
1 vs 8
4 vs 5
3 vs 6
2 vs 7
```

Winners of (1v8) play winners of (4v5), etc. — ensures rank 1 and rank 2 meet latest.

## Third-Place Match

Optional game between semifinal losers.

## Final Ranking

1. Final winner = 1st
2. Final loser = 2nd
3. Third-place winner = 3rd
4. Third-place loser = 4th
5. Quarterfinal losers = 5th-8th (further ranked by Swiss standing)

## Used in

- [Swiss + Playoff](./swiss-playoff.md)
- [Swiss + Barrage + Playoff](./swiss-barrage-playoff.md)
- [TIR Playoff](./tir.md#playoff)
