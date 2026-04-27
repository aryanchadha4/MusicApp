export function normalizeFavoriteArtists(favoriteArtists = [], minSize = 5) {
  const normalized = Array.from({ length: Math.max(minSize, favoriteArtists.length || 0) }, (_, index) => {
    const item = favoriteArtists[index];
    if (item && typeof item === 'object') {
      return {
        name: String(item.name || ''),
        id: String(item.id || ''),
      };
    }
    return {
      name: String(item || ''),
      id: '',
    };
  });

  return normalized;
}

export function normalizeFavoriteSongs(favoriteSongs = [], minSize = 5) {
  const normalized = Array.from({ length: Math.max(minSize, favoriteSongs.length || 0) }, (_, index) => {
    const item = favoriteSongs[index];
    if (item && typeof item === 'object') {
      return {
        title: String(item.title || ''),
        artist: typeof item.artist === 'string' ? item.artist : String(item.artist?.name || ''),
        artistId: String(item.artistId || item.artist?.id || ''),
      };
    }
    return {
      title: String(item || ''),
      artist: '',
      artistId: '',
    };
  });

  return normalized;
}

export function sortReviewsByDate(reviews = []) {
  return [...reviews].sort((a, b) => new Date(b.reviewedAt || 0) - new Date(a.reviewedAt || 0));
}

export function getSongArtistName(song) {
  if (typeof song?.artist === 'string') return song.artist;
  if (typeof song?.artist?.name === 'string') return song.artist.name;
  return '';
}

export function isProfileFollowedByUser(profile, user) {
  if (!profile || !user?.id) return false;
  return Boolean(profile.followers?.some((follower) => follower?._id === user.id));
}

export function getProfileDisplayName(profile) {
  return profile?.name || profile?.username || 'Listener';
}
