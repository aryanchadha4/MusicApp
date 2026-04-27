import { AUTH_SESSION_STORAGE_KEY } from '../../session/constants';
import { createSessionStorageAdapter } from '../../session/createSessionStorageAdapter';

const browserStorage = {
  async getItem(key) {
    try {
      return typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(key) || ''
        : '';
    } catch {
      return '';
    }
  },

  async setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage failures and keep session in memory only.
    }
  },

  async removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage failures and keep session in memory only.
    }
  },
};

export const webSessionStorage = createSessionStorageAdapter({
  key: AUTH_SESSION_STORAGE_KEY,
  storage: browserStorage,
});
