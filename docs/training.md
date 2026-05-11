# Training Module

A standalone tool for structured petanque practice sessions. Completely separate from tournaments and statistics. Accessed via `/training` route.

## Purpose

Create reusable training exercises with specific parameters. Track progress over time to measure improvement at different distances and scenarios.

## Workflow

### 1. Exercise List
Main screen shows all created exercises with:
- Exercise name
- Distance count and series length
- "Start training" button → begin a session
- "View results" button → historical data
- Delete button

### 2. Create Exercise
Define a new exercise template:
- **Name**: How it appears in the list (e.g., "Pointing 6-8m")
- **Distances**: Which distances to practice (e.g., 6m, 7m, 8m)
- **Throws per distance**: How many throws at each distance
- **Series**: Named groups of throws (e.g., "Pointing", "Shooting", "Carreau")
- **Scoring**: Logical (hit/miss) or Points (numeric)
- **Scenario**: If logical — default positive (mark failures) or negative (mark successes)
- **Order**: 
  - Sequential: complete all throws at distance 1, then all at distance 2, etc.
  - Rotation: one throw at each distance in turn, repeat

### 3. Training Session
Execute the exercise:
- Input result for each throw
- Navigate forward/backward through throws
- Distance label shows current target distance
- When all throws complete → "Finish" to calculate

### 4. Results
Per-exercise result history:
- **Average score**: Overall performance percentage or points
- **By distance**: Breakdown showing strengths/weaknesses at each distance
- **History**: Date-ordered list of all past sessions with scores
- **Graph**: Visual trend over time (TrainingResultGraph component)

## Exercise Example

**"Shooting Competition"** (3 series):
- Series 1: "Short range" — 6m, 7m × 10 throws each
- Series 2: "Medium range" — 8m, 9m × 10 throws each  
- Series 3: "Long range" — 10m, 11m × 10 throws each
- Scoring: Logical (hit/miss)
- Order: Sequential (finish each distance before moving to next)

Total: 120 throws. Results show performance by distance band.

## Data Storage

```
Firebase path: {uid}/training/
  list/
    {exerciseId}: {
      name: string,
      distances: number[],
      length: number,        // throws per distance
      series: string[],      // series names
      scoring: string,       // "logical" | "points"
      scenario: string,      // "positive" | "negative"
      order: string          // "sequential" | "rotation"
    }
  {exerciseId}/
    {dateISO}: {
      results: [...],        // per-throw outcomes
      score: number,         // calculated total
      byDistance: {...}       // breakdown
    }
```
