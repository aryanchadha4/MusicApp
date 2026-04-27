function normalizeSessionShape(session = {}) {
  return {
    token: typeof session.token === 'string' ? session.token : '',
    user: session.user ?? null,
    profile: session.profile ?? null,
  };
}

export function createSessionStorageAdapter({ key, storage }) {
  const readRaw = async () => {
    const value = await storage.getItem(key);
    return typeof value === 'string' ? value : '';
  };

  const parseSession = async () => {
    const raw = await readRaw();
    if (!raw) return normalizeSessionShape();

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return normalizeSessionShape(parsed);
      }
    } catch {
      return normalizeSessionShape({ token: raw });
    }

    return normalizeSessionShape();
  };

  const persistSession = async (session) => {
    const normalized = normalizeSessionShape(session);
    if (!normalized.token && !normalized.user && !normalized.profile) {
      await storage.removeItem(key);
      return normalizeSessionShape();
    }
    await storage.setItem(key, JSON.stringify(normalized));
    return normalized;
  };

  return {
    key,

    async getSession() {
      return parseSession();
    },

    async setSession(session) {
      return persistSession(session);
    },

    async clearSession() {
      await storage.removeItem(key);
    },

    async getToken() {
      const session = await parseSession();
      return session.token || '';
    },

    async setToken(token) {
      const session = await parseSession();
      return persistSession({ ...session, token: String(token || '') });
    },

    async clearToken() {
      const session = await parseSession();
      if (session.user || session.profile) {
        return persistSession({ ...session, token: '' });
      }
      await storage.removeItem(key);
      return normalizeSessionShape();
    },
  };
}
