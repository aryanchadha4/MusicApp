import { apiRequest } from './httpClient';

export const musicClient = {
  rateAlbum(body) {
    return apiRequest('/api/auth/rate-album', {
      method: 'POST',
      body,
      auth: true,
    });
  },

  editReview(body) {
    return apiRequest('/api/auth/edit-review', {
      method: 'POST',
      body,
      auth: true,
    });
  },

  deleteReview(body) {
    return apiRequest('/api/auth/delete-review', {
      method: 'POST',
      body,
      auth: true,
    });
  },

  getAlbumReviews(albumId) {
    return apiRequest('/api/auth/album-reviews', {
      query: { albumId },
    });
  },
};
