# Cadrage (Play-In Round)

French: "cadrer" = to frame/align. A qualifying elimination round between Swiss and [Playoff](./playoff.md).

## Purpose

Bridges the gap when more teams qualify than the bracket needs. Gives "bubble" teams a fair last chance.

## Example: 50 teams, top-16 playoff with cadrage

- Positions 1-8: Directly seeded into playoff bracket
- Positions 9-24: Play cadrage (16 teams → 8 games → 8 winners join the bracket)
- Positions 25-50: Tournament over

## Pairing

Best-of-bubble vs worst-of-bubble: rank 9 vs rank 24, rank 10 vs rank 23, etc. Higher-ranked team has home-field advantage of being "team 1".

## Math

If `playOffTeams = T` and cadrage is enabled:

- Direct seeds: top `T/2` teams skip cadrage
- Cadrage pool: teams ranked `T/2 + 1` through `T*1.5`
- Cadrage produces `T/2` winners who fill the bracket

## Used in

- [Swiss + Barrage + Playoff](./swiss-barrage-playoff.md) (optional step)
