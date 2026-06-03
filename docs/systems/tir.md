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
| Tab | Admin | Public |
|-----|-------|--------|
| Participants | Names + clubs, click to open scoring | Names + scores, expandable detail |
| Scoring | Progress bars, throw counts, per-atelier grids | — |
| Table | Ranked results, qualification highlight | Ranked results |
| Playoff | Bracket + match scoring | Bracket + read-only match detail |

Default view: Scoring (admin) / Playoff if available, else Participants (public).

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

## Components
- `TirModule.vue` — Admin: all tabs (participants, scoring, table, playoff)
- `TirPublicView.vue` — Public: participants, table, playoff (read-only)
- `TirPlayoffMatch.vue` — Shared: match scoring grid (supports `readOnly` prop for public view)
- `TirParticipantView.vue` — Per-participant scoring grid
- `TirAtelierView.vue` — Per-atelier scoring (all participants for one station)
