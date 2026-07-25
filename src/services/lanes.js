export function parseExcludedLaneNumbers(value) {
  if (!value) return [];

  return [
    ...new Set(
      String(value)
        .split(',')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((lane) => Number.isInteger(lane) && lane > 0),
    ),
  ];
}

export function getAvailableLaneNumbers(tournament, requiredLaneCount) {
  const preferences = tournament?.preferences || {};
  const poolFrom = Number(preferences.lanesPoolFrom);
  const poolTo = Number(preferences.lanesPoolTo);
  const usePool =
    preferences.lanesPoolEnabled &&
    Number.isInteger(poolFrom) &&
    Number.isInteger(poolTo) &&
    poolFrom > 0 &&
    poolTo >= poolFrom;
  const fallbackCount = Math.max(Number(requiredLaneCount) || 0, 1);
  const firstLane = usePool ? poolFrom : Math.max(Number(preferences.fieldsStart) || 1, 1);
  const lastLane = usePool ? poolTo : firstLane + fallbackCount - 1;
  const excluded = new Set(parseExcludedLaneNumbers(preferences.lanesExcluded));

  return Array.from({ length: lastLane - firstLane + 1 }, (_, index) => firstLane + index).filter(
    (lane) => !excluded.has(lane),
  );
}

export function getGameLaneNumber(game, tournament, gameIndex = 0) {
  if (game?.lane != null && game.lane !== '') {
    const storedLane = Number(game.lane);
    if (Number.isInteger(storedLane) && storedLane >= 0) return storedLane + 1;
  }

  const fieldsStart = Math.max(Number(tournament?.preferences?.fieldsStart) || 1, 1);
  return Number(gameIndex) + fieldsStart;
}
