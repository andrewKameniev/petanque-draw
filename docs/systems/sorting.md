# Group Sorting & Ranking Algorithms

Different tournament systems use different ranking criteria. This document summarizes the sorting logic for each.

## Swiss Ranking
```
wins > buchholz > smallBuchholz > (pointsPlus - pointsMinus) > pointsPlus > rating
```
See [Ranking Algorithms](../ranking-algorithms.md) for Buchholz calculation.

## Groups (Round-Robin) Ranking
```
wins > directWins > directPoints > (pointsPlus - pointsMinus)
```
When teams are tied on wins, only head-to-head results between the tied teams matter.

## Supermele Ranking
```
wins > (pointsPlus - pointsMinus) > pointsPlus > rating
```
No Buchholz — meaningless when teams change every round.

## Barrage Group Ranking
```
wins > (pointsPlus - pointsMinus)
```
Only results within the barrage group count. A team needs 2+ wins to qualify.

## TIR Ranking
```
totalScore > carreauCount
```
Pure precision-based. Tiebreaker is the number of perfect throws (carreau = bulls-eye).

## Playoff Seeding
All systems: the Swiss/Group/TIR ranking at the time of playoff start determines seeding. Higher-ranked players get favorable bracket positions (see [Playoff](./playoff.md)).

## Lane Assignment
Across all systems, lanes are assigned to minimize repeat assignments:
1. Build weight matrix: team → lane → play count
2. For each game, pick the lane with minimum combined weight for both teams
3. Fresh lanes (never played) are preferred

For Supermele: individual player lane history is tracked (since team compositions change).
