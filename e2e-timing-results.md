# E2E Test Timing Results

Date: 2026-07-01

## Combined Run (swiss + groups + tir)

**Result: PASS** (40/40 passed, 0 flaky, 0 failed)
**Total time: 8m 00s** (single thread)

## 1. tir.spec.js

**Result: PASS** (8/8 passed)
**Total suite time: ~1m 20s**

| #   | Test                                              | Time    |
| --- | ------------------------------------------------- | ------- |
| 1   | creates TIR tournament and shows participant list | 00:08.5 |
| 2   | scoring view shows progress for participant       | 00:09.2 |
| 3   | table view shows results after scoring            | 00:09.5 |
| 4   | 2-round system: R1 table shows correct labels     | 00:09.8 |
| 5   | 2-round system: transition to R2                  | 00:10.1 |
| 6   | 2-round system: start playoff after R2            | 00:11.2 |
| 7   | playoff match opens comparison view               | 00:11.6 |
| 8   | junior mode uses 3 distances                      | 00:09.9 |

## 2. swiss.spec.js

**Result: PASS** (17/17 passed)
**Total suite time: ~3m 00s**

| #   | Test                                                        | Time    |
| --- | ----------------------------------------------------------- | ------- |
| 1   | 4 teams — supermele, 2 rounds, finish                       | 00:10.2 |
| 2   | 8 teams — 3 rounds swiss, finish                            | 00:09.8 |
| 3   | 8 teams — swiss + playoff (top 4) full bracket to winner    | 00:10.5 |
| 4   | 8 teams — swiss + cadrage + playoff (top 4) full bracket    | 00:10.6 |
| 5   | 16 teams — swiss + playoff (top 8) full bracket to winner   | 00:11.8 |
| 6   | 16 teams — swiss + cadrage + playoff (top 8) full bracket   | 00:11.3 |
| 7   | 40 teams — swiss + playoff (top 16) full bracket            | 00:12.4 |
| 8   | 40 teams — swiss + cadrage + playoff (top 16) full bracket  | 00:12.5 |
| 9   | swiss round limit — cannot draw beyond ceil(log2(N)) rounds | 00:10.8 |
| 10  | 5 teams (odd) — swiss with bye, playoff top 4, full bracket | 00:10.9 |
| 11  | 7 teams (odd) — swiss, 3 rounds, finish                     | 00:09.9 |
| 12  | 8 teams — swiss + playoff + Group B creation                | 00:11.3 |
| 13  | 16 teams — swiss + cadrage + playoff + Group B              | 00:11.3 |
| 14  | playoff confirm — disable cadrage at confirmation           | 00:09.3 |
| 15  | playoff confirm — enable cadrage at confirmation            | 00:11.3 |
| 16  | playoff confirm — change team count at confirmation         | 00:10.2 |
| 17  | playoff confirm — enable Group B at confirmation            | 00:10.9 |

## 3. groups.spec.js

**Result: PASS** (15/15 passed)
**Total suite time: ~3m 40s**

| #   | Test                                                                             | Time    | Status |
| --- | -------------------------------------------------------------------------------- | ------- | ------ |
| 1   | 8 teams — 2 groups of 4, full round-robin (3 rounds)                             | 00:10.1 | PASS   |
| 2   | 9 teams (odd) — 3 groups of 3, full round-robin with bye                         | 00:09.8 | PASS   |
| 3   | 16 teams — 4 groups of 4, full round-robin (3 rounds)                            | 00:10.0 | PASS   |
| 4   | 12 teams — 2 groups of 6, full round-robin (5 rounds)                            | 00:10.4 | PASS   |
| 5   | 7 teams (odd) — 1 group of 7, full round-robin with bye (7 rounds)               | 00:10.9 | PASS   |
| 6   | 5 teams (odd) — 1 group of 5, full round-robin with bye (5 rounds)               | 00:10.8 | PASS   |
| 7   | 4 teams — multi-circle round-robin (2 circles)                                   | 00:10.8 | PASS   |
| 8   | 4 teams — multi-circle round-robin (3 circles), cumulative ranking               | 00:13.1 | PASS   |
| 9   | snake distribution — 14 per group, 4 swiss rounds → playoff 16 + Group B         | 00:20.8 | PASS   |
| 10  | seeded distribution — 14 per group, 4 swiss rounds, time limit 50min             | 00:17.9 | PASS   |
| 11  | snake distribution — 14 per group, 4 swiss rounds, score by round + Group B      | 00:18.8 | PASS   |
| 12  | balanced random distribution — draw method is selectable and groups created      | 00:16.7 | PASS   |
| 13  | snake distribution — Group B initialized with remaining teams after playoff      | 00:18.6 | PASS   |
| 14  | snake distribution — time limit 40min, no timelimit finale                       | 00:18.7 | PASS   |
| 15  | snake distribution — verify playoff confirm shows correct team count from groups | 00:19.2 | PASS   |
