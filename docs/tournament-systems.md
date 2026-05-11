# Tournament Systems

## Swiss System

The primary format for petanque tournaments. NOT a round-robin — teams play a limited number of rounds with intelligent pairing.

### Core Rules
- A team NEVER plays the same opponent twice
- After round 1, teams with equal wins play each other (strongest vs strongest within same tier)
- Within a tier of equal-win teams, pairing is first-vs-last: if 6 teams share the same wins, they pair as 1-6, 2-5, 3-4
- An odd number of teams = "Technical" bye for the weakest team that hasn't had one yet

### Why Max Rounds ~ N/2
Each round eliminates one possible future opponent per team. With N teams you have N-1 possible opponents. After ~N/2 rounds the algorithm can't find valid pairs because everyone available was already played.

| Teams | Max rounds |
|-------|-----------|
| 8     | 4         |
| 12    | 6         |
| 16    | 8         |
| 24    | 12        |
| 50    | 25        |

The app caps at `Math.round(N/2)`. Attempting more returns a draw error.

### First Round Pairing
- Without rating: completely random
- With rating: seeded (rank 1 vs rank N/2+1, rank 2 vs rank N/2+2, etc.)

### Subsequent Round Pairing
1. Sort all teams by ranking (wins > Buchholz > SBuchholz > point diff > rating)
2. Group teams by number of wins
3. Within each win-tier: pair first with last
4. If pairing is invalid (already played): try next available opponent
5. If no valid opponent in tier: expand search with backtracking algorithm
6. If all backtracking exhausted: return error "can't draw"

### Technical Win (Bye)
When odd teams: lowest-ranked team gets a walkover with preset score (default 13:7). A team can only receive one Technical bye per tournament.

---

## Groups (Round-Robin)

Teams split into groups. Within each group, everyone plays everyone (full round-robin).

### Group Formation
- With rating: snake distribution (1,4,5,8 in group A; 2,3,6,7 in group B) — ensures balanced groups
- Without rating: random distribution
- Special 2-group scheme for <33 teams using tournament-bracket-style distribution

### Scheduling (Circle Method)
Position 0 is fixed, all others rotate. For N teams in a group, there are N-1 rounds (or N rounds if odd, with one bye per round).

### Ranking Within Group
1. Wins
2. Direct head-to-head result (between tied teams only)
3. Direct point difference (between tied teams only)
4. Overall point difference

### After Groups
Top N teams from each group advance to playoff/cadrage.

---

## Supermele

Social/fun format. Individual players register alone. Teams are randomly reformed EVERY round.

### How It Works
- Players are individual participants (not fixed teams)
- Each round: shuffle all players into random doubles (2-player) or triples (3-player)
- The app calculates the optimal doubles/triples mix to include everyone
- Tracks which players were teammates to avoid repeats (best-effort, 100 attempts)

### Team Formation Math
For N players with preferred team size P:
- Calculate games needed: `floor(N / P)`
- Adjust mix of doubles/triples until `doubles*2 + triples*3 = N`
- Example: 11 players, prefer doubles → 4 doubles (8) + 1 triple (3) = 11

### Ranking
- Wins > Point difference > Points scored > Rating
- No Buchholz (meaningless with random teams)

---

## Cadrage (Play-In Round)

French: "cadrer" = to frame/align. A qualifying elimination round between Swiss and playoff.

### Purpose
Bridges the gap when more teams qualify than the bracket needs. Gives "bubble" teams a fair last chance.

### Example: 50 teams, top-16 playoff with cadrage
- Positions 1-8: Directly seeded into playoff bracket
- Positions 9-24: Play cadrage (16 teams → 8 games → 8 winners join the bracket)
- Positions 25-50: Tournament over

### Pairing
Best-of-bubble vs worst-of-bubble: rank 9 vs rank 24, rank 10 vs rank 23, etc. Higher-ranked team has home-field advantage of being "team 1".

### Math
If `playOffTeams = T` and cadrage is enabled:
- Direct seeds: top `T/2` teams skip cadrage
- Cadrage pool: teams ranked `T/2 + 1` through `T*1.5`
- Cadrage produces `T/2` winners who fill the bracket

---

## Playoff (Single Elimination)

Knockout bracket. Supports 4, 8, 16, 32, 64 teams.

### Seeding
Standard tournament bracket seeding ensures top seeds avoid each other:
- Seed 1 and Seed 2 meet only in the final (opposite halves)
- Seeds 3-4 distributed into quarter-halves
- Uses predefined `BRACKET_ORDERS` for 16+ team brackets

### Bracket Positions (example: 8 teams)
```
1 vs 8
4 vs 5
3 vs 6
2 vs 7
```
Winners of (1v8) play winners of (4v5), etc. — ensures rank 1 and rank 2 meet latest.

### Third-Place Match
Optional game between semifinal losers.

### Final Ranking
1. Final winner = 1st
2. Final loser = 2nd  
3. Third-place winner = 3rd
4. Third-place loser = 4th
5. Quarterfinal losers = 5th-8th (further ranked by Swiss standing)

---

## Tournament B

Optional companion tournament for players eliminated from playoff.

### How It Works
When the organizer enables "Tournament B" before starting playoff:
1. After playoff teams are selected, remaining teams are copied to a NEW tournament
2. Their stats (wins, opponents, points) are reset
3. This new tournament starts fresh as an independent Swiss tournament
4. The organizer can run both tournaments simultaneously (up to 10 active)

### When It's Useful
Large tournaments where half the field would otherwise sit idle during playoff. Tournament B gives them more games.
