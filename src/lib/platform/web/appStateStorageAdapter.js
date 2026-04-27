import { APP_SHELL_STATE_STORAGE_KEY } from '../../appShell/constants';
import { createAppShellStateStorage } from '../../appShell/createAppShellStateStorage';

const browserStorage = {
  getItemSync(key) {
    try {
      return typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(key) || ''
        : '';
    } catch {
      return '';
    }
  },

  async getItem(key) {
    return this.getItemSync(key);
  },

  async setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage failures and keep app state in memory only.
    }
  },

  async removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage failures and keep app state in memory only.
    }
  },
};

export const webAppShellStateStorage = createAppShellStateStorage({
  key: APP_SHELL_STATE_STORAGE_KEY,
  storage: browserStorage,
});

export function getStoredWebAppShellStateSync() {
  return webAppShellStateStorage.getStateSync();
}
