# Barrage (Poules de Barrage)

Round-robin qualification format. Can be used as a **standalone system** (`system: "poules"`) or as a **phase within Swiss** (`tournament.barrage`).

## As Standalone System (`system: "poules"`)

Teams are placed into groups and play a full round-robin within each group. This is the "Poules" system option in tournament setup.

### Group Formation

- Organizer sets group size (e.g., 3 or 4 teams per group)
- Distribution follows the same logic as [Groups](./groups.md) (snake seeding with rating, random without)

### Round Scheduling

Same circle method as Groups — position 0 fixed, others rotate.

### Ranking Within Groups

```
wins > (pointsPlus - pointsMinus)
```

### After Poules

Top teams per group can advance to [Playoff](./playoff.md).

---

## As Phase Within Swiss (`tournament.barrage`)

Inserted between Swiss rounds and [Playoff](./playoff.md) to create a decisive qualification stage.

### How It Works

1. After Swiss rounds complete, the organizer triggers barrage
2. Teams in the qualifying range are distributed into small groups (typically 3-4 per group)
3. Within each group, every team plays every other team (full round-robin)
4. Top N teams per group advance to playoff

### Qualification

A team needs 2+ wins in its barrage group to qualify for playoff.

### Ranking

Only barrage results count for advancement — Swiss results are used for seeding into groups but not for barrage ranking.

## Used in

- Standalone poules tournament
- [Swiss + Barrage + Playoff](./swiss-barrage-playoff.md)
