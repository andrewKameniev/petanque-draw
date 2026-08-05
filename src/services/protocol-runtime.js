export async function fetchPortalTournamentTeams(portalId) {
  const url = new window.URL(`https://portal.petanque.org.ua/tournament/team_export/${encodeURIComponent(portalId)}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('_fresh', Date.now().toString());
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Portal responded ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data?.teams)) throw new Error('Portal returned an invalid tournament export');
  return data.teams;
}

export function saveProtocolHtml(storageKey, element) {
  if (element) localStorage.setItem(storageKey, element.innerHTML);
}

export function readProtocolHtml(storageKey) {
  return localStorage.getItem(storageKey);
}

export function restoreProtocolEditableHtml(savedRoot, currentRoot) {
  if (!savedRoot || !currentRoot) return 0;

  const savedCells = [...savedRoot.querySelectorAll('[contenteditable]')];
  const currentCells = [...currentRoot.querySelectorAll('[contenteditable]')];
  const savedByKey = new Map(
    savedCells.filter((cell) => cell.dataset?.protocolEditKey).map((cell) => [cell.dataset.protocolEditKey, cell]),
  );
  let restored = 0;

  currentCells.forEach((cell) => {
    const key = cell.dataset?.protocolEditKey;
    const savedCell = key ? savedByKey.get(key) : null;
    if (!savedCell) return;

    const savedSource = savedCell.dataset?.protocolSource ?? '';
    const currentSource = cell.dataset?.protocolSource ?? '';
    if (savedSource !== currentSource) return;

    cell.innerHTML = savedCell.innerHTML;
    restored += 1;
  });

  // One-time migration for protocols saved before stable editable keys existed.
  // Only restore explicitly manual fields, and only when the document shape is unchanged.
  if (!savedByKey.size && savedCells.length === currentCells.length) {
    currentCells.forEach((cell, index) => {
      if (cell.dataset?.protocolManual !== 'true') return;
      cell.innerHTML = savedCells[index].innerHTML;
      restored += 1;
    });
  }

  return restored;
}

export function clearProtocolHtml(storageKey) {
  localStorage.removeItem(storageKey);
}

export function removeProtocolMarkers(element) {
  if (!element) return 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.includes('ДОПИШІТЬ МЕНЕ')) nodes.push(walker.currentNode);
  }
  nodes.forEach((node) => {
    node.textContent = node.textContent.replace(/\s*!!! ДОПИШІТЬ МЕНЕ!!!\s*/g, '');
  });
  return nodes.length;
}

export function copyProtocolElement(element) {
  if (!element) return false;
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  try {
    return document.execCommand('copy');
  } finally {
    selection.removeAllRanges();
  }
}

export async function exportProtocolPdf(element, options) {
  if (!element) return;
  const { default: html2pdf } = await import('html2pdf.js');
  element.classList.add('is-exporting');

  const responsiveState = [];
  if (options.normalizeResponsive) {
    element.querySelectorAll('.table-container').forEach((tableContainer) => {
      responsiveState.push({
        element: tableContainer,
        overflow: tableContainer.style.overflow,
        maxWidth: tableContainer.style.maxWidth,
      });
      tableContainer.style.overflow = 'visible';
      tableContainer.style.maxWidth = 'none';
    });
    element.querySelectorAll('.is-hidden-mobile').forEach((node) => {
      node.style.setProperty('display', 'inline', 'important');
    });
    element.querySelectorAll('.is-hidden-tablet').forEach((node) => {
      node.style.setProperty('display', 'none', 'important');
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  try {
    await html2pdf().set(options.html2pdf).from(element).save();
  } finally {
    element.classList.remove('is-exporting');
    responsiveState.forEach(({ element: node, overflow, maxWidth }) => {
      node.style.overflow = overflow;
      node.style.maxWidth = maxWidth;
    });
    element.querySelectorAll('.is-hidden-mobile, .is-hidden-tablet').forEach((node) => {
      node.style.removeProperty('display');
    });
  }
}
