import { buildAuthUser } from '../../domain/models';

function emptySessionResult() {
  return {
    user: null,
    profile: null,
    token: '',
  };
}

function buildSessionResult({ token = '', profile = null, fallbackUser = null }) {
  const user = buildAuthUser(profile || fallbackUser);
  return {
    user: user?.id ? user : null,
    profile: profile || null,
    token: String(token || ''),
  };
}

export function createAuthSessionService({
  authClient,
  profileClient,
  sessionStorage,
  config,
}) {
  const {
    authDisabled = false,
    devUserEmail = '',
  } = config || {};

  const fetchDevSession = async () => {
    if (!devUserEmail) {
      await sessionStorage.clearSession();
      return emptySessionResult();
    }

    const profile = await profileClient.getProfileByEmail(devUserEmail);
    const session = buildSessionResult({ profile });
    await sessionStorage.setSession(session);
    return session;
  };

  const fetchCurrentUser = async () => {
    if (authDisabled) {
      return fetchDevSession();
    }

    const existingSession = await sessionStorage.getSession();
    if (!existingSession.token) {
      return emptySessionResult();
    }

    const profile = await authClient.me();
    const session = buildSessionResult({
      token: existingSession.token,
      profile,
      fallbackUser: existingSession.user,
    });
    await sessionStorage.setSession(session);
    return session;
  };

  return {
    async restoreSession() {
      if (authDisabled) {
        try {
          return await fetchDevSession();
        } catch {
          await sessionStorage.clearSession();
          return emptySessionResult();
        }
      }

      const token = await sessionStorage.getToken();
      if (!token) {
        await sessionStorage.clearSession();
        return emptySessionResult();
      }

      try {
        return await fetchCurrentUser();
      } catch {
        await sessionStorage.clearSession();
        return emptySessionResult();
      }
    },

    async login(identifier, password) {
      const authPayload = await authClient.login(identifier, password);
      const token = authPayload?.token || '';
      const fallbackUser = authPayload?.user || null;

      if (!token || !buildAuthUser(fallbackUser)?.id) {
        throw new Error('Login failed');
      }

      const optimisticSession = buildSessionResult({ token, fallbackUser });
      await sessionStorage.setSession(optimisticSession);

      try {
        return await fetchCurrentUser();
      } catch {
        return optimisticSession;
      }
    },

    async logout() {
      await sessionStorage.clearSession();
      return emptySessionResult();
    },

    async signup(userData) {
      return authClient.signup(userData);
    },

    async reloadCurrentUser() {
      try {
        return await fetchCurrentUser();
      } catch {
        if (!authDisabled) {
          await sessionStorage.clearSession();
        }
        return emptySessionResult();
      }
    },

    async getStoredSession() {
      return sessionStorage.getSession();
    },
  };
}
