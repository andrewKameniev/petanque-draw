export function cleanPlayerName(name) {
  return String(name || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizePlayerName(name) {
  return cleanPlayerName(name).toLocaleLowerCase();
}

function getIdentitiesList(identities) {
  return Object.values(identities || {}).filter((identity) => identity?.portalPlayerId != null);
}

function getIdentityIndex(identitiesOrIndex) {
  if (identitiesOrIndex?.byId instanceof Map && identitiesOrIndex?.byName instanceof Map) {
    return identitiesOrIndex;
  }
  return buildPlayerIdentityIndex(identitiesOrIndex);
}

export function buildPlayerIdentityIndex(identities) {
  const byId = new Map();
  const byCanonicalName = new Map();
  const byAlias = new Map();

  const addName = (target, name, identity) => {
    const normalized = normalizePlayerName(name);
    if (!normalized) return;
    if (target.has(normalized) && target.get(normalized)?.portalPlayerId !== identity.portalPlayerId) {
      target.set(normalized, null);
      return;
    }
    target.set(normalized, identity);
  };

  getIdentitiesList(identities).forEach((identity) => {
    const portalPlayerId = String(identity.portalPlayerId);
    const normalizedIdentity = { ...identity, portalPlayerId };
    byId.set(portalPlayerId, normalizedIdentity);
    addName(byCanonicalName, identity.name, normalizedIdentity);
    (identity.aliases || []).forEach((alias) => addName(byAlias, alias, normalizedIdentity));
  });

  const byName = new Map(byCanonicalName);
  byAlias.forEach((identity, name) => byName.set(name, identity));
  return { byId, byName };
}

export function getPlayerIdentity(player, identitiesOrIndex) {
  if (!player) return null;
  const index = getIdentityIndex(identitiesOrIndex);
  if (player.portalPlayerId != null) {
    return index.byId.get(String(player.portalPlayerId)) || null;
  }
  return index.byName.get(normalizePlayerName(player.name)) || null;
}

export function getPlayerIdentityKey(player, identitiesOrIndex) {
  if (!player) return '';
  if (player.portalPlayerId != null) return `portal:${String(player.portalPlayerId)}`;
  const identity = getPlayerIdentity(player, identitiesOrIndex);
  if (identity) return `portal:${identity.portalPlayerId}`;
  const normalized = normalizePlayerName(player.name);
  return normalized ? `legacy:${normalized}` : '';
}

export function extractPlayerIdentities(stats, identities) {
  if (!stats) return [];
  const index = buildPlayerIdentityIndex(identities);
  const players = new Map();

  Object.values(stats).forEach((game) => {
    [...(game?.team1?.players || []), ...(game?.team2?.players || [])].forEach((player) => {
      const key = getPlayerIdentityKey(player, index);
      if (!key || players.has(key)) return;
      const portalPlayerId = key.startsWith('portal:') ? key.slice(7) : null;
      const identity = portalPlayerId ? index.byId.get(portalPlayerId) : null;
      players.set(key, {
        key,
        name: cleanPlayerName(identity?.name || player.name),
        portalPlayerId,
      });
    });
  });

  return [...players.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function collectCanonicalPlayers(stats, identities) {
  const canonical = new Map();

  getIdentitiesList(identities).forEach((identity) => {
    const portalPlayerId = String(identity.portalPlayerId);
    canonical.set(portalPlayerId, {
      portalPlayerId,
      name: cleanPlayerName(identity.name),
      aliases: [...(identity.aliases || [])],
      directGames: 0,
    });
  });

  Object.values(stats || {}).forEach((game) => {
    const seen = new Set();
    [...(game?.team1?.players || []), ...(game?.team2?.players || [])].forEach((player) => {
      if (player?.portalPlayerId == null) return;
      const portalPlayerId = String(player.portalPlayerId);
      if (!canonical.has(portalPlayerId)) {
        canonical.set(portalPlayerId, {
          portalPlayerId,
          name: cleanPlayerName(player.name),
          aliases: [],
          directGames: 0,
        });
      }
      if (!seen.has(portalPlayerId)) {
        canonical.get(portalPlayerId).directGames += 1;
        seen.add(portalPlayerId);
      }
    });
  });

  return [...canonical.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function collectLegacyPlayers(stats) {
  const legacy = new Map();

  Object.values(stats || {}).forEach((game) => {
    const seen = new Set();
    [...(game?.team1?.players || []), ...(game?.team2?.players || [])].forEach((player) => {
      if (player?.portalPlayerId != null || !player?.name?.trim()) return;
      const normalized = normalizePlayerName(player.name);
      if (!legacy.has(normalized)) {
        legacy.set(normalized, { name: cleanPlayerName(player.name), normalized, games: 0 });
      }
      if (!seen.has(normalized)) {
        legacy.get(normalized).games += 1;
        seen.add(normalized);
      }
    });
  });

  return [...legacy.values()].sort((a, b) => a.name.localeCompare(b.name));
}
