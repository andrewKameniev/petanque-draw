# Ranking & Algorithms

## Swiss Ranking (sortTeams)

Tiebreakers applied in strict order:

```
wins > buchholz > smallBuchholz > (pointsPlus - pointsMinus) > pointsPlus > rating
```

### Buchholz Calculation

```
For each team:
  buchholz = sum of (each opponent's wins)

For each team:
  smallBuchholz = sum of (each opponent's buchholz)
```

Both are recalculated before every draw because opponents' wins change after each round.

**Why Buchholz matters:** Two teams with 3 wins — one beat only weak opponents (who lost most games), the other beat strong opponents (who also won). Buchholz rewards quality of opposition.

**Why double-restore corrupts Buchholz:** Restoring pops the last opponent from `team.opponents[]`. Restoring twice removes 2 opponents, breaking the entire Buchholz chain for all teams (since it's recursive: your Buh depends on opponents' Buh which depends on their opponents...).

---

## Groups Ranking (getTeamsRanking for groups)

Within each group:

```
wins > directWins > directPoints > (pointsPlus - pointsMinus)
```

**Direct encounters:** When 2+ teams are tied on wins, only their head-to-head results matter:

- `directWins`: How many of the other tied teams this team beat directly
- `directPoints`: Point difference in games between tied teams only

---

## Supermele Ranking (sortTeamsForSupermele)

```
wins > (pointsPlus - pointsMinus) > pointsPlus > rating
```

No Buchholz — meaningless when "opponents" = past teammates.

---

## Swiss Pairing Algorithm (drawSwissRound)

```
Input: ranked team list, round number
Output: array of game pairings OR error

1. Sort all teams by ranking
2. If odd teams:
   - Find weakest team that hasn't had a Technical bye
   - Assign them automatic win (13:7 default)
   - Remove from pairing pool

3. While teams remain in pool:
   a. Take team[0] (highest ranked unpaired)
   b. Find opponent via generateCompetitorsFirstLast():
      - Group teams by wins
      - Within same-wins group: try last-ranked team first
      - Check opponents[] to ensure no rematch
      - If invalid: try next available

   c. If no valid opponent found (opponentIndex = -1):
      - Backtrack: undo last 1-2 pairings
      - Re-add those teams to pool
      - Try again with "reverse" mode (first-vs-next instead of first-vs-last)
      - Repeat up to stopExpandIndex times (= N/2 - 1)

   d. If backtracking exhausted: return {error: 'cantDraw'}

   e. Create game: {team_1, team_2, scores: null}
   f. Remove both teams from pool
```

### Backtracking Detail

When team A can't find an opponent, the algorithm undoes the most recent pairing(s) and tries different combinations. This handles edge cases where a "greedy" first choice blocks later pairings.

---

## Lane Assignment Algorithm (assignLanes)

Goal: minimize repeated lane assignments for the same team across rounds.

```
Input: games array, tournament (with teams and lane history)
Output: games with lane property set, sorted by lane

1. Build weight matrix: team → lane → play count
   (from team.lanes[] history)

2. If Swiss with odd teams: extract Technical game (no lane needed)

3. For each game:
   a. Get "played lanes" for both teams (union of team1.lanes + team2.lanes)
   b. Get "fresh lanes" = available lanes NOT in played set
   c. From candidates (fresh if available, else all):
      - Pick lane with minimum combined weight for both teams
   d. Assign lane to game
   e. Update weight matrix
   f. Remove lane from available pool

4. Re-add Technical game (no lane)
5. Sort all games by lane number
```

### Supermele Lane Assignment

Same algorithm but counts ALL individual players' lane history (since "teams" change each round).

---

## Playoff Bracket Building (buildPlayOffScheme)

```
Input: playOffList (ranked teams), hasCadrage flag
Output: array of first-round games with seeding

For i = 0 to playOffList.length/2:
  if i is even: pair[i] vs pair[N-1-i]     (1v8, 3v6, 5v4, 7v2)
  if i is odd:  pair[N/2-i] vs pair[N/2-1+i] (4v5, 2v7, 6v3, 8v1)

Then reorder using BRACKET_ORDERS for proper bracket positioning.
```

### Bracket Reordering

Ensures top seeds are distributed so they meet latest possible:

- 8 teams: swap positions [2↔4] and [3↔5]
- 16/32/64/128 teams: predefined position arrays

---

## Cadrage Game Building (buildCadrageGames)

```
Input: playOffList (bubble teams), teamToPlayOff count
Output: cadrage game pairings

For i = 0 to playOffList.length/2:
  game = {
    team_1: playOffList[i]                    (higher ranked)
    team_2: playOffList[length - 1 - i]       (lower ranked)
    places: calculated from teamToPlayOff offset
  }
```

Example: playOffTeams=16, cadrage pool = ranks 9-24:

- Game 1: rank 9 vs rank 24
- Game 2: rank 10 vs rank 23
- ...
- Game 8: rank 16 vs rank 17

---

## Important Constraints

| Rule                            | Reason                                     |
| ------------------------------- | ------------------------------------------ |
| Never play same opponent twice  | Swiss fundamental                          |
| Max rounds ~ N/2                | Pairing becomes impossible beyond this     |
| Restore only once between draws | Protects Buchholz integrity                |
| No tied scores                  | Petanque always has a winner               |
| Max score validation            | Prevents invalid data (default 13)         |
| Playoff teams = power of 2      | Required for bracket structure             |
| Technical score is fixed        | Walkover uses configured score             |
| Up to 10 tournaments            | Firebase per-user limit                    |
| Cadrage doubles qualifying pool | If playoff=8, cadrage handles 8 more teams |
