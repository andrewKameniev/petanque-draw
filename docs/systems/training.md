# Training (Tir Training Sessions)

Personal tir training module. Authenticated users can create, run, rerun, and analyze shooting practice sessions.

## Session Types (Presets)
- **Full Tir** — All 5 exercises at all distances (6m, 7m, 8m, 9m)
- **Single Exercise** — Pick one exercise, all distances
- **Single Distance** — One exercise, one distance, multiple attempts
- **Custom** — Fully configure exercises, distances, and attempt count

## Session Lifecycle
```
Draft → In Progress → Completed
                  ↘ Rerun (creates new session with same config)
```

## Auto-Generated Names
Session names follow the pattern: `[Exercise names]. [Distances].`
- All exercises selected → "All exercises"
- All distances selected → "All distances"
- Subset → comma-separated list (e.g. "Exercise 1, Exercise 2. 6m, 7m.")

## Fill Zeros Button
"Fill 0" button in the session scoring view fills all empty (unanswered) attempts for the current exercise with "manque" (0 points). Does not overwrite existing scores.

## Rerun
Completed sessions show a rerun button (rotate icon). Creates a fresh session with the same type, config, and name — ready to score again. Each run is timestamped independently.

## Statistics Views
Two view modes toggled via icons:
1. **Summary** — Cards (avg, best, total, sessions), distribution bars, per-distance breakdown, progress-over-time chart
2. **Stacked Bar Chart** — ApexCharts stacked bar showing carreau/réussi/touché/manqué counts per session over time

Both views support filters: exercise, distance, date range.

## Data Model
```javascript
session = {
  id: "timestamp-string",
  name: "Session Name",
  type: "tir_full" | "tir_single_exercise" | "tir_single_distance" | "tir_custom",
  status: "draft" | "in_progress" | "completed",
  config: { exercises: [0,1,...], distances: [6,7,8,9], attempts: N },
  attempts: [{ exerciseIndex, distance, attemptNumber, score }],
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: timestamp | null
}
```

## Components
- `TrainingCreate.vue` — Preset selection + configuration wizard
- `TrainingSession.vue` — Active session scoring grid with fill-zeros
- `TrainingStats.vue` — Statistics with summary/stacked toggle
- `TrainingStackedChart.vue` — ApexCharts stacked bar chart
- `Training.vue` (view) — Main page with session list, rerun, and tabs

## Navigation
Accessed via the Training icon (green Target) in the navbar center. Requires authentication.
