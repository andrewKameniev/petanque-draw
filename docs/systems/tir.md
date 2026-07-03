# TIR (Tir de Précision)

Precision shooting tournament. Individual players compete across 5 ateliers (exercise stations) at multiple distances.

## Structure

- 5 ateliers (shooting exercises), each scored at distances 6m, 7m, 8m, 9m (seniors) or 6m, 7m, 8m (juniors)
- Each throw scored as: Carreau (5 pts), Réussi (3 pts), Touché (1 pt), Manqué (0 pts)
- Max score per atelier: 20 pts (senior) or 15 pts (junior)
- Max total score: 100 pts (senior) or 75 pts (junior)

## Scoring Flow

Two modes available:

- **By participant**: Select a player, fill all 5 ateliers for them
- **By atelier**: Select an atelier, fill scores for all players at that station

When all distances in an atelier are scored, the next atelier opens automatically.

## Finish Atelier

"Finish atelier for all" button sets all unscored throws to Manqué for every player in that atelier. Requires confirmation.

## Ranking

```
total score > carreau count (tiebreaker)
```

## Views

| Tab          | Admin                                          | Public                            |
| ------------ | ---------------------------------------------- | --------------------------------- |
| Participants | Names + clubs, click to open scoring           | Names + scores, expandable detail |
| Scoring      | Progress bars, throw counts, per-atelier grids | —                                 |
| Table        | Ranked results, qualification highlight        | Ranked results                    |
| Playoff      | Bracket + match scoring                        | Bracket + read-only match detail  |

Default view: Scoring (admin) / Playoff if available, else Participants (public).

## 2-Round Qualification System

Optional mode selected before tournament start (`tirConfig.rounds: 2`).

### Flow

1. **Round 1**: All players compete (scores in `participant.scores`)
2. **After R1**: Top 4 qualify directly to quarterfinals; places 5-20 advance to Round 2 (players tied with 20th place are also included)
3. **Round 2**: Qualified players repeat all exercises (scores in `participant.scores2`)
4. **Qualification**: Top 4 from R2 by combined score (R1 + R2) join the 4 direct qualifiers
5. **Playoff**: 8 seeded players → QF → SF → Final + 3rd place

### Data Model

```javascript
tournament.tirConfig.rounds = 2       // 1 or 2 (chosen before start)
tournament.tirRound = 1 | 2           // active round being scored
tournament.tirR2Participants = [id1, id2, ...]  // IDs of players in R2

participant.scores = {...}            // Round 1 scores (never overwritten)
participant.scores2 = {...}           // Round 2 scores (same shape as scores)
```

### Table View (2-round mode)

Columns: `# | Player | R1 | R2 | 1/4 | 1/2 | Final | Place`

- Direct qualifiers: green highlight
- R2 participants: orange highlight
- Eliminated: dimmed text

## Playoff

When enough participants have completed scoring, the organizer can start a playoff bracket (2, 4, 8, 16, 32, or 64 players).

### Seeded Bracket

Top-N players by score are placed in a standard seeded bracket (same logic as [Playoff](./playoff.md)).

### Match Scoring

Each playoff match is a full TIR competition between two players — 5 ateliers, same distances. The match component tracks:

- Per-player, per-atelier, per-distance scores
- Running totals
- Auto-advance: completing an atelier opens the next; completing all 5 for one player switches to the other
- Match auto-closes when both players are done (winner determined by total score)

### Tie Resolution

If both players score equal totals, the organizer manually selects the winner (tie-break shootout happens off-app).

## Data Model

```javascript
tournament.tirConfig = { junior: false }
tournament.tirParticipants = [{
  id: timestamp,
  name: "Player Name",
  city: "Club/City",
  scores: {
    0: { 6: "carreau", 7: "reussi", 8: "manque", 9: "touche" },  // atelier 0
    1: { ... },  // atelier 1
    // ...
  },
  lane: 1
}]
tournament.tirPlayoff = {
  size: 4,
  qualified: ["Player A", "Player B", ...],
  rounds: [{ matches: [Match, ...] }],
  thirdPlace: Match | null,
  final: Match | null
}
```

### Match Object

```javascript
{
  player1: "Name", player2: "Name",
  scores1: { 0: {6: "carreau", ...}, ... },  // player 1 per-atelier scores
  scores2: { ... },                           // player 2
  score1: 45, score2: 38,                     // totals (computed)
  complete: true,
  winner: "Name", loser: "Name",
  tieWinner: null | 1 | 2
}
```

## Public Playoff View

The public playoff view shows:

- Timeline with progress dots (green for completed rounds, orange for final)
- Match cards with grid layout: `[player A] [scoreA] vs [scoreB] [player B]`
- Winners highlighted in green, long names ellipsized, scores never truncated
- Final match card with orange border accent
- Winner celebration block (green card with trophy icon) — shown only when tournament is finished
- CTA button "Go to final table" — switches to the table tab

The old bottom top-4 places list has been removed from the playoff view. Final standings are accessed via the table tab.

Clicking a match card opens `TirPlayoffComparison` — a detailed side-by-side view of both players' scores per atelier and distance.

## Components

- `TirModule.vue` — Admin: all tabs (participants, scoring, table, playoff)
- `TirPublicView.vue` — Public: participants, table, playoff (read-only)
- `TirPlayoffComparison.vue` — Public: read-only match comparison (replaces TirPlayoffMatch in public view)
- `TirPlayoffMatch.vue` — Admin: match scoring grid
- `TirParticipantView.vue` — Per-participant scoring grid
- `TirAtelierView.vue` — Per-atelier scoring (all participants for one station)
