# Petanque Domain

## What is Petanque

Petanque is a boules sport where players throw metal balls (boules) toward a small wooden target ball (cochonnet/jack). Games are played to 13 points. Teams can be:

- **Tete-a-tete** (1v1): 3 boules each
- **Doublet** (2v2): 3 boules each
- **Triplet** (3v3): 2 boules each

## Tournament Systems

### Swiss System
Teams are paired based on standings. Teams with equal wins play each other. No team plays the same opponent twice. Ranking criteria (in order):
1. Wins
2. Buchholz coefficient (sum of opponents' wins)
3. Small Buchholz (sum of opponents' Buchholz)
4. Point difference (scored - conceded)
5. Points scored
6. Rating

### Round-Robin (Groups)
All teams in a group play each other once. Ranking within groups:
1. Wins
2. Head-to-head result
3. Point difference

### Supermele
Individual players are randomly assigned to new teams each round. Supports doublet and triplet formations.

### Playoff (Knockout)
Single-elimination bracket. Supports 2 to 64 teams. Seeding follows standard tournament bracket ordering.

### Cadrage
A qualifying round before playoffs. Middle-ranked teams play to earn a spot in the main bracket.

## Terminology

| Term | Meaning |
|------|---------|
| **Boule** | Metal ball thrown by players |
| **Cochonnet** | Small target ball (jack) |
| **Tir** (Shoot) | Throwing to knock away opponent's boule |
| **Point** | Throwing to place boule near cochonnet |
| **Mene/Man** | A round within a game (ends when all boules thrown) |
| **Carro** | A shot that knocks opponent's boule and stays in place |
| **Technical win** | Default score when opponent forfeits (default: 13-7) |
| **Buchholz** | Tiebreaker: sum of opponents' wins |
| **Lane/Field** | The playing area assigned to a game |
| **UFP Portal** | Ukrainian Petanque Federation online platform |

## Statistics Systems

### Simple System
Binary outcome per throw: success or failure. Tracked separately for points and tirs.

### French System
Grades each throw on a scale (A through I) evaluating both volume and intensity:
- A: Best outcome (volume: 1.5, intensity: 1)
- D: Neutral (volume: 0, intensity: 0.5)
- I: Worst outcome (volume: -2, intensity: 0)

## Training Module

Exercises consist of throws at specific distances (6-11m). Results tracked over time with:
- Logical scoring (hit/miss)
- Point scoring (numeric value per throw)
- Multiple series per exercise
- Distance-first or rotation ordering
