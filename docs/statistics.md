# Statistics Module

A standalone tool for tracking individual game performance. Completely separate from the tournament draw system. Accessed via `/stats` route.

## Purpose

Track throw-by-throw statistics during petanque games. Analyze player performance over time. Compare results across different conditions (distances, partners, opponents).

## Workflow

### 1. Setup

Before starting tracking:

- **Game name**: Label for this recording (e.g., "Semi-final vs Team X")
- **Tags**: Categorize games for later filtering (e.g., "tournament", "practice", "rain")
- **Teams**: Define team 1 and team 2 with player names
- **Mode**: Simple or French system
- **Scoring**: Logical (hit/miss) or Points (numeric per throw)
- **Scenario**: Default positive (all marked as hit) or negative (all marked as miss)
- **As coach**: Track from spectator perspective

### 2. Tracking (During Game)

Per-throw recording interface:

- Select current player (mene/round rotation)
- Record throw result (tap to mark success/failure or enter score)
- Track distance (6m-11m typically)
- Navigate between throws with arrows
- Context menu for shot type (point/tir/other)
- Undo/redo throws
- x2 shortcut for double results

### 3. Results (After Game)

Automatic calculations:

- Final score
- Team performance comparison
- Per-player statistics:
  - Hit rate (percentage)
  - Shots per round
  - Series analysis (consecutive successes/failures)
- Round-by-round point breakdown
- Visual charts (ApexCharts)

## Scoring Systems

### Simple System

Binary: each throw is either a success (1) or failure (0).

- Separate tracking for "point" throws and "tir" (shooting) throws
- Performance = successes / total throws

### French System

Granular grading using letters A through I:

| Grade | Volume | Intensity | Meaning       |
| ----- | ------ | --------- | ------------- |
| A     | 1.5    | 1.0       | Excellent     |
| B     | 1.0    | 1.0       | Very good     |
| C     | 0.5    | 1.0       | Good          |
| D     | 0      | 0.5       | Neutral       |
| E     | -0.5   | 0.5       | Below average |
| F     | -0.5   | 0         | Poor          |
| G     | -1.0   | 0         | Bad           |
| H     | -1.5   | 0         | Very bad      |
| I     | -2.0   | 0         | Worst         |

Volume = contribution to scoring. Intensity = effort/engagement level.

## Archive

All completed games stored in Firebase under `stats/{gameKey}`.

- Filter by tags
- Filter by date range
- View any past game's full results
- Add/remove tags retroactively

## Analysis

Aggregated statistics across multiple games:

- **Select player**: Analyze one player's performance
- **Select period**: Date range filter
- **Select format**: Doublet/Triplet/All
- **Select tag**: Filter by game type
- **Select distance**: Focus on specific distances
- **Result**: Aggregated hit rates and trends
- **Charts**: Performance over time visualization

## Data Storage

```
Firebase path: {uid}/stats/
  tags: { [tagId]: { name: string, color: string } }
  {gameKey}: {
    name: string,
    date: string,
    tags: string[],
    team1: { players: [...], throws: [...] },
    team2: { players: [...], throws: [...] },
    settings: { system, scoring, scenario }
  }
```
