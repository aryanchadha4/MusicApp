export const APP_TABS = [
  { key: 'home', to: '/home', label: 'Home', hint: 'Start' },
  { key: 'search', to: '/search', label: 'Search', hint: 'Discover' },
  { key: 'network', to: '/network', label: 'Network', hint: 'Friends' },
  { key: 'activity', to: '/activity', label: 'Activity', hint: 'Library' },
  { key: 'profile', to: '/profile', label: 'Profile', hint: 'You' },
];

const TAB_KEYS = new Set(APP_TABS.map((tab) => tab.key));

export function normalizeSectionKey(section) {
  return TAB_KEYS.has(section) ? section : 'home';
}

export function getSectionRoot(section) {
  return `/${normalizeSectionKey(section)}`;
}

export function buildSectionPath(section, suffix = '') {
  const root = getSectionRoot(section);
  const normalizedSuffix = String(suffix || '').replace(/^\/+/, '');
  return normalizedSuffix ? `${root}/${normalizedSuffix}` : root;
}

export function buildAlbumPath(section, albumId) {
  return buildSectionPath(section, `album/${encodeURIComponent(albumId)}`);
}

export function buildArtistPath(section, artistId, query = {}) {
  const path = buildSectionPath(section, `artist/${encodeURIComponent(artistId)}`);
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function buildUserPath(section, userId) {
  return buildSectionPath(section, `users/${encodeURIComponent(userId)}`);
}

export function buildUserReviewsPath(section, userId) {
  return buildSectionPath(section, `users/${encodeURIComponent(userId)}/reviews`);
}
