const ARBITER_SHEET_ID = '1yXDjYCX3nISBCt8-S-vmvIU31rb4SmhtRsWc8PbQy7Q';
const ARBITER_SHEET_GID = '0';

export const ARBITER_SHEET_URL = `https://docs.google.com/spreadsheets/d/${ARBITER_SHEET_ID}/edit?gid=${ARBITER_SHEET_GID}#gid=${ARBITER_SHEET_GID}`;

function cellValue(row, index) {
  const cell = row?.c?.[index];
  if (!cell) return '';
  return String(cell.f ?? cell.v ?? '').trim();
}

export function resolveArbiterCategory(values) {
  const normalized = values.map((value) =>
    String(value ?? '')
      .trim()
      .toUpperCase(),
  );

  if (normalized.some((value) => value.includes('НК'))) return 'НК';
  if (normalized.some((value) => value === '1' || value === 'І')) return '1';
  if (normalized.some((value) => value === '2' || value === 'ІІ')) return '2';
  return 'АФПУ';
}

export function isMainArbiterRole(role) {
  const normalizedRole = String(role || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('uk-UA');

  // Keep accepting the former term so saved protocols and presets migrate cleanly.
  return normalizedRole === 'головний суддя' || normalizedRole === 'головний арбітр';
}

export function normalizeArbiterRole(role) {
  return isMainArbiterRole(role) ? 'Головний суддя' : 'Суддя';
}

export function normalizeArbiterSetup(arbiters = []) {
  return arbiters
    .filter((arbiter) => arbiter?.name)
    .map((arbiter) => ({
      name: arbiter.name || '',
      role: normalizeArbiterRole(arbiter.role),
      category: arbiter.category || 'АФПУ',
      certificate: arbiter.certificate || '',
      region: arbiter.region || '',
    }));
}

export function buildArbiterSelection(arbiters, selectedIndexes, mainArbiterIndex = '') {
  return selectedIndexes
    .map((index) => ({ arbiter: arbiters[Number(index)], index: String(index) }))
    .filter(({ arbiter }) => arbiter?.name)
    .map(({ arbiter, index }) => ({
      ...arbiter,
      role: index === String(mainArbiterIndex) ? 'Головний суддя' : 'Суддя',
    }));
}

function normalizeArbiterName(name) {
  let normalized = String(name || '')
    .normalize('NFKC')
    .replace(/[’ʼ`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('uk-UA');

  if (/[а-яіїєґ]/i.test(normalized) && /[a-z]/i.test(normalized)) {
    const latinLookalikes = {
      a: 'а',
      b: 'в',
      c: 'с',
      e: 'е',
      h: 'н',
      i: 'і',
      k: 'к',
      m: 'м',
      o: 'о',
      p: 'р',
      t: 'т',
      x: 'х',
      y: 'у',
    };
    normalized = normalized.replace(/[abcehikmoptxy]/g, (letter) => latinLookalikes[letter]);
  }

  return normalized;
}

function normalizeArbiterCertificate(certificate) {
  return String(certificate || '').trim();
}

function shortArbiterNameKey(arbiter) {
  return normalizeArbiterName(arbiter?.name).split(' ').slice(0, 2).join(' ');
}

function buildUniqueArbiterMap(arbiters, keyForArbiter) {
  const result = new Map();
  arbiters.forEach((arbiter) => {
    const key = keyForArbiter(arbiter);
    if (!key) return;
    result.set(key, result.has(key) ? null : arbiter);
  });
  return result;
}

export function matchCurrentArbiterSelection(arbiters = [], currentArbiters = []) {
  const current = currentArbiters.filter((arbiter) => arbiter?.name);
  const currentByCertificate = buildUniqueArbiterMap(current, (arbiter) =>
    normalizeArbiterCertificate(arbiter.certificate),
  );
  const currentByName = buildUniqueArbiterMap(current, (arbiter) => normalizeArbiterName(arbiter.name));
  const currentByShortName = buildUniqueArbiterMap(current, shortArbiterNameKey);
  const selectedIndexes = [];
  let mainArbiterIndex = '';

  arbiters.forEach((arbiter, index) => {
    const currentArbiter =
      currentByCertificate.get(normalizeArbiterCertificate(arbiter.certificate)) ||
      currentByName.get(normalizeArbiterName(arbiter.name)) ||
      currentByShortName.get(shortArbiterNameKey(arbiter));
    if (!currentArbiter) return;

    selectedIndexes.push(String(index));
    if (isMainArbiterRole(currentArbiter.role)) mainArbiterIndex = String(index);
  });

  return { selectedIndexes, mainArbiterIndex };
}

export function refreshArbitersFromRegistry(registryArbiters = [], currentArbiters = []) {
  const registryByCertificate = buildUniqueArbiterMap(registryArbiters, (arbiter) =>
    normalizeArbiterCertificate(arbiter.certificate),
  );
  const registryByName = buildUniqueArbiterMap(registryArbiters, (arbiter) => normalizeArbiterName(arbiter.name));
  const registryByShortName = buildUniqueArbiterMap(registryArbiters, shortArbiterNameKey);
  let matched = 0;
  let changed = 0;

  const arbiters = currentArbiters.map((currentArbiter) => {
    const registryArbiter =
      registryByCertificate.get(normalizeArbiterCertificate(currentArbiter?.certificate)) ||
      registryByName.get(normalizeArbiterName(currentArbiter?.name)) ||
      registryByShortName.get(shortArbiterNameKey(currentArbiter));
    const role = normalizeArbiterRole(currentArbiter?.role);

    if (!registryArbiter) return { ...currentArbiter, role };

    matched += 1;
    const refreshedArbiter = { ...currentArbiter, ...registryArbiter, role };
    if (
      ['name', 'role', 'category', 'certificate', 'region'].some(
        (field) => refreshedArbiter[field] !== currentArbiter[field],
      )
    ) {
      changed += 1;
    }
    return refreshedArbiter;
  });

  return { arbiters, matched, changed };
}

export function parseArbiterRegistryTable(table) {
  if (!table?.cols || !table?.rows) return [];

  const indexesByLabel = table.cols.reduce((indexes, column, index) => {
    const label = column?.label?.trim();
    if (!label) return indexes;
    if (!indexes[label]) indexes[label] = [];
    indexes[label].push(index);
    return indexes;
  }, {});
  const firstIndex = (label) => indexesByLabel[label]?.[0] ?? -1;
  const nameIndex = firstIndex('ПІП судді');
  const regionIndex = firstIndex('Область');
  const certificateIndex = firstIndex('№ посвідчення');
  const categoryIndexes = indexesByLabel['Присвоєна категорія'] || [];

  if (nameIndex < 0 || regionIndex < 0) return [];

  return table.rows
    .map((row) => {
      const name = cellValue(row, nameIndex);
      if (!name) return null;

      return {
        name,
        category: resolveArbiterCategory(categoryIndexes.map((index) => cellValue(row, index))),
        certificate: certificateIndex >= 0 ? cellValue(row, certificateIndex) : '',
        region: cellValue(row, regionIndex),
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.name.localeCompare(second.name, 'uk'));
}

export function fetchArbiterRegistryFromSheet({
  windowObject = window,
  documentObject = document,
  timeoutMs = 15000,
} = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `__petanqueArbiters_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = documentObject.createElement('script');
    let settled = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      script.remove();
      delete windowObject[callbackName];
    };
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };

    windowObject[callbackName] = (response) => {
      if (response?.status !== 'ok' || !response.table) {
        finish(reject, new Error('Google Sheet returned an invalid arbiter registry response'));
        return;
      }
      finish(resolve, parseArbiterRegistryTable(response.table));
    };
    script.async = true;
    script.onerror = () => finish(reject, new Error('Could not load the arbiter registry from Google Sheets'));
    const tqx = encodeURIComponent(`out:json;responseHandler:${callbackName}`);
    script.src = `https://docs.google.com/spreadsheets/d/${ARBITER_SHEET_ID}/gviz/tq?tqx=${tqx}&gid=${ARBITER_SHEET_GID}&_=${Date.now()}`;

    const timeoutId = setTimeout(() => finish(reject, new Error('Loading the arbiter registry timed out')), timeoutMs);
    documentObject.head.appendChild(script);
  });
}
