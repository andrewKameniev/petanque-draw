# Streams

Stream presets allow assigning streaming links to teams or lanes so they auto-resolve for matches.

## Data Model

```
tournament.streamPresets = {
  teams: { [teamTitle]: [url1, url2, ...] },
  lanes: { [laneNumber]: [url1, url2, ...] }
}
```

## Resolution Order

For each game, streams are resolved in this order (deduplicated by URL):
1. Manual `game.stream_url` (set per-game in admin)
2. Team presets (both team_1 and team_2 URLs)
3. Lane presets (based on `gameIndex + fieldsStart`)

## Platform Detection

URLs are matched to platforms by content:
- `youtube` / `youtu.be` -> YouTube (red icon)
- `twitch` -> Twitch (purple icon)
- `facebook` / `fb.` -> Facebook (blue icon)
- `instagram` -> Instagram (pink icon)
- Other -> generic Video icon (red)

## Admin Tab

The "Streams" tab (Radio icon, always red) has two subtabs:
- **Teams**: assign stream URLs per team
- **Lanes**: assign stream URLs per lane number

## Public View

Matches show platform-colored icons for each resolved stream, with "Live" / "Stream" label.
Streams appear even before match starts if presets are assigned.
