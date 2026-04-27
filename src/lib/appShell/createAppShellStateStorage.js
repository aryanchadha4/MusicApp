import { normalizeAppShellState } from './mobileAppState';

export function createAppShellStateStorage({ key, storage }) {
  const parseValue = (raw) => {
    if (!raw || typeof raw !== 'string') {
      return normalizeAppShellState(null);
    }

    try {
      return normalizeAppShellState(JSON.parse(raw));
    } catch {
      return normalizeAppShellState(null);
    }
  };

  return {
    key,

    async getState() {
      const raw = await storage.getItem(key);
      return parseValue(raw);
    },

    getStateSync() {
      if (typeof storage.getItemSync !== 'function') {
        return normalizeAppShellState(null);
      }

      return parseValue(storage.getItemSync(key));
    },

    async setState(state) {
      const normalized = normalizeAppShellState(state);
      await storage.setItem(key, JSON.stringify(normalized));
      return normalized;
    },

    async clearState() {
      await storage.removeItem(key);
    },
  };
}
