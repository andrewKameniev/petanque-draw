# Training Module

A standalone tool for structured petanque practice sessions. Completely separate from tournaments and statistics. Accessed via `/training` route.

## Purpose

Create reusable training exercises with specific parameters. Track progress over time to measure improvement at different distances and scenarios.

## Tabs

The training page has two tabs:

1. **Tir Training** — New session-based Tir precision shooting training with presets
2. **Exercises** — Legacy exercise system (custom exercises with flexible scoring)

---

## Tir Training Sessions

### Session Lifecycle

Sessions have three statuses:

- **Draft** — Created but no scores entered yet
- **In Progress** — Scoring has started
- **Completed** — All attempts recorded, session marked as finished

Users can always:

- Open and continue any session
- Reopen completed sessions
- Edit entered results (toggle scores)
- Change training date and name
- Save progress and return later (auto-saved to Firebase)

### Presets

| Preset          | Exercises        | Distances      | Attempts          |
| --------------- | ---------------- | -------------- | ----------------- |
| Full Tir        | All 5 ateliers   | 6m, 7m, 8m, 9m | 1 per distance    |
| Single Exercise | 1 chosen atelier | 6m, 7m, 8m, 9m | 1 per distance    |
| Single Distance | 1 atelier        | 1 distance     | 10 (configurable) |
| Custom          | User picks       | User picks     | User picks (1-50) |

### Training Creation Flow

1. Select preset type
2. Configure exercises/distances/attempts (some locked by preset)
3. Optionally set training name
4. Start session → scoring view

### Scoring UI

Reuses the Tir scoring model (carreau/reussi/touche/manque):

- Exercise tabs (numbered circles, green = complete)
- Per-distance attempt grids
- Each attempt shows 4 colored cells (one per score type)
- Tap to set, tap same to clear
- Real-time score totals and progress bar

### Statistics

Filterable analytics across all sessions:

- **By Exercise** — Filter to a specific atelier
- **By Distance** — Filter to a specific distance
- **By Date Range** — From/to date picker
- **Combined** — Exercise + Distance filter

Metrics shown:

- Average score per attempt
- Best score
- Total attempts count
- Sessions count
- Score distribution (carreau/reussi/touche/manque percentages)
- Per-distance breakdown
- Progress over time chart

### Data Architecture

Every attempt is stored individually with metadata:

```ts
{
  exerciseIndex: number,  // 0-4 (which atelier)
  distance: number,       // 6, 7, 8, 9, etc.
  attemptNumber: number,  // 1-based within exercise+distance
  score: string           // 'carreau' | 'reussi' | 'touche' | 'manque'
}
```

```
Firebase path: {uid}/training/sessions/{sessionId}
  {
    id: string,
    name: string,
    type: 'tir_full' | 'tir_single_exercise' | 'tir_single_distance' | 'tir_custom',
    status: 'draft' | 'in_progress' | 'completed',
    config: { exercises: number[], distances: number[], attempts: number },
    attempts: Array<{exerciseIndex, distance, attemptNumber, score}>,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: timestamp | null
  }
```

---

## Legacy Exercises

### Workflow

#### 1. Exercise List

Main screen shows all created exercises with:

- Exercise name
- Distance count and series length
- "Start training" button → begin a session
- "View results" button → historical data
- Delete button

#### 2. Create Exercise

Define a new exercise template:

- **Name**: How it appears in the list
- **Distances**: Which distances to practice
- **Throws per distance**: How many throws at each distance
- **Series**: Named groups of throws
- **Scoring**: Logical (hit/miss) or Points (numeric)
- **Scenario**: If logical — default positive or negative
- **Order**: Sequential or Rotation

#### 3. Training Session

Execute the exercise and input results for each throw.

#### 4. Results

Per-exercise result history with averages, distance breakdowns, and graphs.

### Data Storage

```
Firebase path: {uid}/training/
  list/
    {exerciseId}: { name, distances, length, complex, value, points, scenario, distanceFirst }
  {exerciseId}/
    {timestamp}: { date, distances: { [dist]: number[] } }
```
