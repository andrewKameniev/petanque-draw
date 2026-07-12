# Supermele

Social/fun format. Individual players register alone. Teams are reformed EVERY round.

## Modes

### Ideal (default)

Balanced team formation that equalizes team strength each round:

- **Round 1 (no rating)**: fully random
- **Round 1 (with rating)**: players sorted by rating, top paired with bottom
- **Round 2+**: players sorted by wins (then point difference), top paired with bottom

Example with 8 players after round 1 (sorted by wins):
```
Wins: 1  1  1  1  0  0  0  0
       ↕           ↕
      Team1       Team2
```
Player with 1 win pairs with player with 0 wins.

For triples: top + middle + bottom from the sorted list.

The "no repeat teammates" constraint is enforced — if the ideal partner was already a teammate, the algorithm picks the next best candidate.

### Standard

Fully random team formation every round. Only constraint: avoid pairing the same players together twice.

## Team Formation

For N players with preferred team size (doubles or triples):

- **Doubles preferred**: all doubles by default. If player count is odd, one triple is added (or technical win if needed)
- **Triples preferred**: all triples. Leftover players form doubles

### Avoid Technical Win (checkbox, on by default)

When enabled, the algorithm splits or joins teams instead of giving a technical:

- **Doubles**: if odd number of teams — last double splits into a 1v1 (tête-à-tête) match
- **Triples**: converts triples to doubles to achieve even team count (e.g. 2 triples → 3 doubles preserves 6 players)
- **Odd player count**: joins leftover player into a triple when that results in even team count
- If none of the above works — technical win is given to the weakest player

Examples (doubles, avoid-technical ON):
```
8 players  → 4 doubles = 2 matches
9 players  → 3 doubles + 1 triple = 4 teams = 2 matches
10 players → 5 doubles (odd) → 4 doubles + 1 tête-à-tête = 2 matches + 1v1
11 players → 1 technical + 5 doubles (odd) → 1 tech + 2 matches + 1v1
12 players → 6 doubles = 3 matches
```

## Ranking

Individual stats accumulate across all rounds:

```
1. Wins (more = better)
2. Point difference (pointsPlus - pointsMinus)
3. Points scored (pointsPlus)
4. Rating (if enabled)
```

No Buchholz — meaningless when teammates change every round.

### How points are counted

After each round, for every player:
- **Win**: if your team won the game, you get +1 win
- **Points plus**: your team's score is added to your pointsPlus
- **Points minus**: opponent team's score is added to your pointsMinus
- **Teammates**: recorded to avoid repeat pairings (stored in `opponents` array)

Example: Player A is in a double (A, B) that wins 13:8.
- A gets: wins +1, pointsPlus +13, pointsMinus +8
- B gets the same

## Prize Places

Configurable number of highlighted positions in the ranking table (default 3). Set in tournament preferences.

## Lane Assignment

Same algorithm as Swiss but tracks lane history per individual player (since teams change each round). Avoids assigning a player to the same lane in consecutive rounds.
