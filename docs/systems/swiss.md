# Swiss System

The primary format for petanque tournaments. NOT a round-robin — teams play a limited number of rounds with intelligent pairing.

## Core Rules
- A team NEVER plays the same opponent twice
- After round 1, teams with equal wins play each other (strongest vs strongest within same tier)
- Within a tier of equal-win teams, pairing is first-vs-last: if 6 teams share the same wins, they pair as 1-6, 2-5, 3-4
- An odd number of teams = "Technical" bye for the weakest team that hasn't had one yet

## Why Max Rounds ~ N/2
Each round eliminates one possible future opponent per team. With N teams you have N-1 possible opponents. After ~N/2 rounds the algorithm can't find valid pairs because everyone available was already played.

| Teams | Max rounds |
|-------|-----------|
| 8     | 4         |
| 12    | 6         |
| 16    | 8         |
| 24    | 12        |
| 50    | 25        |

The app caps at `Math.round(N/2)`. Attempting more returns a draw error.

## First Round Pairing
- Without rating: completely random
- With rating: seeded (rank 1 vs rank N/2+1, rank 2 vs rank N/2+2, etc.)

## Subsequent Round Pairing
1. Sort all teams by ranking (wins > Buchholz > SBuchholz > point diff > rating)
2. Group teams by number of wins
3. Within each win-tier: pair first with last
4. If pairing is invalid (already played): try next available opponent
5. If no valid opponent in tier: expand search with backtracking algorithm
6. If all backtracking exhausted: return error "can't draw"

## Technical Win (Bye)
When odd teams: lowest-ranked team gets a walkover with preset score (default 13:7). A team can only receive one Technical bye per tournament.

## Ranking
```
wins > buchholz > smallBuchholz > (pointsPlus - pointsMinus) > pointsPlus > rating
```

See [Ranking Algorithms](../ranking-algorithms.md) for Buchholz calculation details.

## Combinations
- [Swiss + Playoff](./swiss-playoff.md)
- [Swiss + Barrage + Playoff](./swiss-barrage-playoff.md)
