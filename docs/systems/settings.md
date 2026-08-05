# Tournament Settings

Configuration options available before and during the tournament.

## Pre-Start Settings (SetupCard)

### System Selection

| System               | Min teams | Constraints               |
| -------------------- | --------- | ------------------------- |
| Swiss                | 5         | —                         |
| Groups (Round-Robin) | 3         | —                         |
| Playoff              | 3         | —                         |
| Poules               | 8         | Team count divisible by 4 |
| Supermele            | 3         | —                         |
| Tir                  | 2         | Individual, not teams     |

### General Settings

| Setting         | Default | Purpose                                                                 |
| --------------- | ------- | ----------------------------------------------------------------------- |
| Use rating      | false   | Seeded first-round pairing and group distribution based on team ratings |
| Technical score | 13:7    | Walkover result for bye rounds (winner:loser)                           |
| Max score       | 13      | Game ends at this score                                                 |
| Test tournament | false   | Mark as training (not counted in official records)                      |

### Playoff Settings

| Setting         | Default | Purpose                                           |
| --------------- | ------- | ------------------------------------------------- |
| Playoff enabled | false   | Enable knockout stage after qualifying            |
| Playoff format  | single  | Single or double elimination                      |
| Playoff teams   | 8       | How many advance to knockout (4, 8, 16, 32)       |
| With cadrage    | false   | Play-in round for bubble teams before playoff     |
| With barrage    | false   | Round-robin groups for middle teams (Swiss only!) |
| Barrage teams   | 8       | How many teams enter barrage groups               |
| Tournament B    | false   | Create parallel tournament for cadrage losers     |

### Timer Settings

| Setting              | Default | Purpose                                  |
| -------------------- | ------- | ---------------------------------------- |
| Time limit enabled   | false   | Per-round countdown timer                |
| Time limit           | 45 min  | Time for swiss/group rounds              |
| Playoff time limit   | 70 min  | Time for playoff rounds (0 = no limit)   |
| No time limit finale | false   | Disable timer for the final match        |
| Cochonettes          | 1       | Number of cochonettes after time expires |

### Per-Round Scoring (cochonettes)

| Setting                        | Default | Purpose                                                |
| ------------------------------ | ------- | ------------------------------------------------------ |
| Per-round scoring (qualifying) | false   | Track score history per cochonette during swiss/groups |
| Per-round scoring (playoff)    | false   | Track score history per cochonette during playoff      |

### Lanes/Fields

| Setting            | Default | Purpose                                            |
| ------------------ | ------- | -------------------------------------------------- |
| Lanes pool enabled | false   | Use a defined range of lanes instead of sequential |
| Lanes pool from/to | 1-10    | Range of available lanes (pool mode)               |
| Fields start       | 1       | First lane number (sequential mode)                |
| Lanes excluded     | —       | Comma-separated lanes to skip                      |

### Swiss-Specific

| Setting      | Default     | Purpose                                        |
| ------------ | ----------- | ---------------------------------------------- |
| Rounds count | log₂(teams) | Target number of Swiss rounds                  |
| Prize places | 3           | How many places to highlight (when no playoff) |

### Groups-Specific

| Setting            | Default     | Purpose                                                 |
| ------------------ | ----------- | ------------------------------------------------------- |
| Teams in group     | —           | Group size (or "all" for single-group round-robin)      |
| Group format       | round_robin | Round-robin or Swiss within groups                      |
| Group Swiss rounds | 3           | Number of rounds when using Swiss format in groups      |
| Rounds count       | 1           | Number of full circles (single-group round-robin only)  |
| Group draw method  | seeded      | How to distribute teams: seeded, snake, balanced_random |

### Supermele-Specific

| Setting         | Default | Purpose                                            |
| --------------- | ------- | -------------------------------------------------- |
| Players in team | 2       | Doubles (2) or triples (3)                         |
| Mode            | ideal   | Balanced (top+bottom) or standard (random) pairing |
| Tete-a-tete     | true    | Create 1v1 game instead of bye when odd count      |

### TIR-Specific

| Setting           | Default | Purpose                                       |
| ----------------- | ------- | --------------------------------------------- |
| Two-round system  | false   | Top 4 qualify directly, next 16 go to round 2 |
| Junior tournament | false   | Use 3 distances (6-8m) instead of 4 (6-9m)    |

## Settings Changeable During Tournament (Preferences)

These can be modified at any time after the tournament starts:

| Setting             | Condition            |
| ------------------- | -------------------- |
| Playoff enabled     | Until playoff starts |
| Playoff teams       | Until playoff starts |
| Time limit (all)    | Any time             |
| Cochonettes count   | Any time             |
| Per-round scoring   | Any time             |
| Swiss rounds count  | Any time             |
| Prize places        | Any time             |
| Lanes configuration | Any time             |

## Settings Locked After Start

These cannot be changed once the first round is drawn:

- Max score
- Technical score (winner/loser)
- Tournament system
- Group size / group format
- Use rating

## Key files

- `src/components/partials/SetupCard.vue` — Pre-start configuration UI
- `src/components/partials/Preferences.vue` — Mid-tournament settings modal
- `src/stores/main.js` — `defaultPreferences` object
