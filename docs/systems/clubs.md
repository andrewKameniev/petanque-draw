# Club encounters

A club encounter overlays the existing Swiss, groups (round-robin or Swiss),
and single-elimination systems. Each outer game is one encounter between clubs;
its internal games do not become tournament rounds or separate standings wins.

## Import and registration

The ordinary portal-ID import is the entry point. `fetchPortalTournament` reads
both metadata and teams. Since the current export has no discipline field,
`isPortalClubTournament` recognizes a nonempty export whose teams each contain
at least six players. Singles, doubles and triples keep the ordinary import flow.

The organizer reviews the imported clubs and chooses a maximum roster size of
8 or 9 before confirming all rosters. Seven-player rosters are valid; the lower
bound is six, enough to fill every position of a stage. Import keeps the actual
players and their portal photos, badges, ratings and profile clubs without
padding. The captain set on the portal determines the represented club and its
logo. The app cannot change the captain or remove them when trimming an imported
roster to its maximum size.
Players can have other profile clubs. Each player ID may occur in only one
registered club. Confirmation fixes rosters for the whole tournament.

Gender is not entered or inferred. The referee checks the women-only and mixed
positions against the paper forms. Club import configures games to 13 and
technical results to 21:10. Club setup and preferences omit the maximum-score
field because the game score is fixed. Double elimination, barrage, Tournament B, timers,
and end-by-end scoring are not part of this format.

## Paper forms and stages

| Stage   | Positions | Players per position | Points per win | First position                     |
| ------- | --------- | -------------------- | -------------- | ---------------------------------- |
| Singles | 6         | 1                    | 2              | Woman vs woman                     |
| Doubles | 3         | 2                    | 3              | Mixed: one man and one woman       |
| Triples | 2         | 3                    | 5              | Mixed: either two men or two women |

Before each stage the referee enters both captains' paper forms. Six distinct
registered players per club occupy the numbered positions. Position 1 meets
position 1, and so on; there is no internal random draw. Players may change
between stages and encounters. Future-stage forms unlock only after every game
of the previous stage is completed. Published positions can be corrected before
starting the stage, with an audit entry; starting locks its lineups.

## Scoring and completion

Only a confirmed result awards points. The winner has 13; the opponent has an
integer from 0 to 12. Live results award zero. Every correction recomputes totals
from current confirmed results, so repeating a save does not add points again.

Qualification and standalone Swiss/round-robin encounters require all 11 games.
The official total then sums to 31. Playoff encounters automatically complete
at 16 or more club points; remaining games become `not_played` while retaining
lineups and live scores. The referee can continue them; that encounter then
requires all remaining games and does not stop again at 16. A correction that
removes an early winning score reopens stopped games. Editing a playoff result
already used in the next stage requires restoring the bracket stage first.

## Byes

| System      | Result without an opponent | Standings                                   |
| ----------- | -------------------------- | ------------------------------------------- |
| Round-robin | Rest, no score             | No win, points, or opponent contribution    |
| Swiss       | Technical 21:10            | Existing Swiss bye win and tie-break policy |
| Playoff     | Technical 21:10            | Automatic advancement                       |

These records have `clubAbsence` and no fabricated internal games or lineups.
Five clubs in round-robin play five rounds and ten different pairings; each
rests once. Four clubs in playoff have two semifinals and a final, plus a
third-place encounter when configured. There is no special club limit of four
or nine; the selected system's existing limits apply.

## UI and owners

The encounter uses the shared `TournamentNav` for overview, singles, doubles,
triples and rosters. Overview displays all 11 games; only a discipline tab has
lineup and score controls. Game captions show status only; club points are
shown in the stage and encounter totals. Completed scores have an explicit correction action.
`PublicGameCard` provides match presentation and `PlayerChip` provides photos,
ratings and captain badges. The encounter header and each discipline show the
portal club logos in opposing positions; absent logos use a neutral shield.
Public and archive views use the same encounter
component in read-only mode. Club setup omits the rating-based draw toggle.
Club-specific TV presentation is outside scope.

- `src/services/club-encounter.js`: roster/lineup validation, state transitions,
  score derivation, editing eligibility and byes.
- `src/services/club-competition.js`: portal detection/drafts, atomic import
  planning, configuration and historical-statistics recalculation.
- `src/stores/main.js`: access checks, reactive application and write rollback.
- `src/components/clubs/`: import review and encounter interaction.
- [Data model](../data-model.md#club-competition-data): persisted fields.
- [Firebase](../firebase.md#club-encounter-writes): permissions and projection.
