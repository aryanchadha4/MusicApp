import { apiRequest } from './httpClient';

const emptySearchResponse = (type) => {
  if (type === 'artist') {
    return { artists: { items: [] } };
  }
  if (type === 'track') {
    return { tracks: { items: [] } };
  }
  return { albums: { items: [] } };
};

export const spotifyClient = {
  async search(query, type) {
    const trimmedQuery = String(query || '').trim();
    const normalizedType = String(type || '').trim().toLowerCase();

    if (!trimmedQuery || !normalizedType) {
      return emptySearchResponse(normalizedType);
    }

    try {
      return await apiRequest('/api/diary/search', {
        query: { query: trimmedQuery, type: normalizedType },
      });
    } catch (error) {
      const looksLikeUnsupportedArtistSearch =
        normalizedType === 'artist' && (error.status === 400 || error.status === 404);

      if (looksLikeUnsupportedArtistSearch) {
        return emptySearchResponse(normalizedType);
      }

      const canRetryLegacySearch =
        error.status === 404 &&
        typeof error.raw === 'string' &&
        error.raw.includes('Cannot GET /api/diary/search');

      if (!canRetryLegacySearch) {
        throw error;
      }

      return apiRequest('/api/spotify/search', {
        query: { query: trimmedQuery, type: normalizedType },
      });
    }
  },

  async searchItems(query, type) {
    const response = await this.search(query, type);
    if (type === 'artist') {
      return response?.artists?.items || [];
    }
    if (type === 'track') {
      return response?.tracks?.items || [];
    }
    return response?.albums?.items || [];
  },

  async lookupImage({ type, name, artist }) {
    const query = [name, artist].filter(Boolean).join(' ').trim();
    if (!query) return null;

    const items = await this.searchItems(query, type);
    const first = items[0];
    if (!first) return null;

    if (type === 'artist') {
      return first.images?.[0]?.url || null;
    }
    if (type === 'track') {
      return first.album?.images?.[0]?.url || null;
    }
    return first.images?.[0]?.url || null;
  },

  getAlbum(albumId) {
    return apiRequest(`/api/spotify/album/${albumId}`);
  },

  async getArtist(artistId) {
    const response = await apiRequest(`/api/spotify/artist/${artistId}`);
    return response?.artist || response;
  },

  getArtistDetails(artistId) {
    return apiRequest(`/api/spotify/artist/${artistId}`);
  },

  getTopAlbums() {
    return apiRequest('/api/spotify/top-albums');
  },
};
