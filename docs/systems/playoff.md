# Playoff

The organizer can choose single or double elimination when enabling playoff.

## Single Elimination

Classic knockout bracket. Supports 4, 8, 16, 32, 64 teams.

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

## Double Elimination

Every participant starts in the winners bracket. One loss drops to the losers bracket; a second loss eliminates.

### How it works

- Winners bracket plays standard knockout rounds
- Losers of each winners bracket round drop into the losers bracket
- Lower-bracket drops are crossed (reversed order) to prevent immediate rematches
- Winners' Final champion and Losers' Final champion play one decisive Grand Final
- Grand Final mode: single (one game decides the champion)

### Sizes

Any participant count from 2 upward. Non-power-of-two fields are padded with seeded byes to the next power of two.

### Seeding

Uses `getBracketSeedOrder()` — balanced seed positions ensuring:
- Top seeds get byes when field is padded
- Seeds 1 and 2 cannot meet before the upper final

### Bracket viewer

Horizontally scrollable canvas showing both upper and lower brackets with stage labels.

### Final Ranking

1. Grand Final winner = 1st
2. Grand Final loser = 2nd  
3. Onwards — by elimination round in the losers bracket (later elimination = higher place)

Placements are computed by `getDoubleEliminationPlacements()` which walks lower stages from latest to earliest.

### Automatic advancement

`advanceDoubleEliminationBracket()` resolves dependencies:
- When a match finishes, its winner/loser propagate to the next matches automatically
- Bye matches auto-complete (team vs empty = automatic win)
- Multiple passes until no more changes

## Key files

- `src/services/playoff.js` — bracket building, seeding, advancement, result recording
- `src/components/partials/PlayOff.vue` — single elimination UI
- `src/components/partials/DoubleElimination.vue` — double elimination UI
- `src/components/partials/PlayoffConfirmModal.vue` — format selection (single/double)

## Used in

- [Swiss + Playoff](./swiss-playoff.md)
- [Swiss + Barrage + Playoff](./swiss-barrage-playoff.md)
- [TIR Playoff](./tir.md#playoff)
- Standalone playoff (system = 'playoff')
