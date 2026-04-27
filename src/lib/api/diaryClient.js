import { apiRequest } from './httpClient';

export const diaryClient = {
  createEntry(body) {
    return apiRequest('/api/diary/entries', {
      method: 'POST',
      body,
      auth: true,
    });
  },

  getEntries({ userId: _userId, kind = 'all', sort = 'date', order = 'desc' }) {
    return apiRequest('/api/diary/entries', {
      query: { kind, sort, order },
      auth: true,
    });
  },

  updateEntry(entryId, body) {
    return apiRequest(`/api/diary/entries/${entryId}`, {
      method: 'PATCH',
      body,
      auth: true,
    });
  },

  deleteEntry(entryId, _userId) {
    return apiRequest(`/api/diary/entries/${entryId}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
