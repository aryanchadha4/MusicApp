import { APP_TABS, normalizeSectionKey } from '../navigation/appTabs';

const APP_SHELL_STATE_VERSION = 1;

function createDefaultTabPaths(tabs = APP_TABS) {
  return Object.fromEntries(tabs.map((tab) => [tab.key, tab.to]));
}

export function buildLocationKey(locationLike = {}) {
  const pathname = typeof locationLike.pathname === 'string' && locationLike.pathname
    ? locationLike.pathname
    : '/home';
  const search = typeof locationLike.search === 'string' ? locationLike.search : '';
  const hash = typeof locationLike.hash === 'string' ? locationLike.hash : '';
  return `${pathname}${search}${hash}`;
}

export function getSectionFromPathname(pathname = '') {
  const firstSegment = String(pathname || '')
    .split('/')
    .filter(Boolean)[0];

  return normalizeSectionKey(firstSegment || 'home');
}

export function createInitialAppShellState(tabs = APP_TABS) {
  const tabPaths = createDefaultTabPaths(tabs);

  return {
    version: APP_SHELL_STATE_VERSION,
    lastPath: tabPaths.home || '/home',
    tabPaths,
    scrollPositions: {},
  };
}

export function normalizeAppShellState(value, tabs = APP_TABS) {
  const fallback = createInitialAppShellState(tabs);
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const tabPaths = { ...fallback.tabPaths };
  Object.entries(value.tabPaths || {}).forEach(([key, path]) => {
    if (typeof path === 'string' && path) {
      tabPaths[key] = path;
    }
  });

  const scrollPositions = {};
  Object.entries(value.scrollPositions || {}).forEach(([key, y]) => {
    if (typeof key === 'string' && Number.isFinite(Number(y))) {
      scrollPositions[key] = Math.max(0, Number(y));
    }
  });

  return {
    version: APP_SHELL_STATE_VERSION,
    lastPath: typeof value.lastPath === 'string' && value.lastPath ? value.lastPath : fallback.lastPath,
    tabPaths,
    scrollPositions,
  };
}

export function recordLocationInAppShellState(state, locationLike, tabs = APP_TABS) {
  const normalized = normalizeAppShellState(state, tabs);
  const path = buildLocationKey(locationLike);
  const section = getSectionFromPathname(locationLike?.pathname);

  return {
    ...normalized,
    lastPath: path,
    tabPaths: {
      ...normalized.tabPaths,
      [section]: path,
    },
  };
}

export function recordScrollPositionInAppShellState(state, locationKey, scrollY, tabs = APP_TABS) {
  const normalized = normalizeAppShellState(state, tabs);

  return {
    ...normalized,
    scrollPositions: {
      ...normalized.scrollPositions,
      [locationKey]: Math.max(0, Number(scrollY) || 0),
    },
  };
}

export function getTabTargetPath(state, tab) {
  const normalized = normalizeAppShellState(state);
  return normalized.tabPaths?.[tab.key] || tab.to;
}
