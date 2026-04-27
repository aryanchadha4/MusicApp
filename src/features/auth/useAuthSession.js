import { useCallback, useEffect, useState } from 'react';
import { authClient, profileClient } from '../../lib/api';
import { createAuthSessionService } from '../../lib/session';
import { webSessionConfig } from '../../lib/platform/web/sessionConfig';
import { webSessionStorage } from '../../lib/platform/web/sessionStorageAdapter';

const webAuthSessionService = createAuthSessionService({
  authClient,
  profileClient,
  sessionStorage: webSessionStorage,
  config: webSessionConfig,
});

export function useAuthSession() {
  const [user, setUser] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const applySession = useCallback((session) => {
    setUser(session?.user || null);
    setProfileInfo(session?.profile || null);
    return session;
  }, []);

  const reloadProfile = useCallback(async () => {
    const session = await webAuthSessionService.reloadCurrentUser();
    return applySession(session);
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const session = await webAuthSessionService.restoreSession();
        if (!cancelled) {
          applySession(session);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setProfileInfo(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(
    async (identifier, password) => {
      try {
        const session = await webAuthSessionService.login(identifier, password);
        applySession(session);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || 'Login failed' };
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    const session = await webAuthSessionService.logout();
    applySession(session);
  }, [applySession]);

  return {
    user,
    setUser,
    profileInfo,
    setProfileInfo,
    loading,
    login,
    logout,
    reloadProfile,
  };
}
