import { apiRequest } from './httpClient';

export const listsClient = {
  getLists({ userId: _userId, kind = 'all', sort = 'updated', order = 'desc' }) {
    return apiRequest('/api/lists', {
      query: { kind, sort, order },
      auth: true,
    });
  },

  getList(listId, _userId) {
    return apiRequest(`/api/lists/${listId}`, {
      auth: true,
    });
  },

  createList(body) {
    return apiRequest('/api/lists', {
      method: 'POST',
      body,
      auth: true,
    });
  },

  updateList(listId, body) {
    return apiRequest(`/api/lists/${listId}`, {
      method: 'PATCH',
      body,
      auth: true,
    });
  },

  deleteList(listId, _userId) {
    return apiRequest(`/api/lists/${listId}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  addItem(listId, body) {
    return apiRequest(`/api/lists/${listId}/items`, {
      method: 'POST',
      body,
      auth: true,
    });
  },

  removeItem(listId, itemSubdocId, _userId) {
    return apiRequest(`/api/lists/${listId}/items/by-id/${itemSubdocId}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
