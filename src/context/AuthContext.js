import React, { createContext, useState, useContext, useEffect } from 'react';
import { authClient, profileClient } from '../lib/api';
import { createAuthSessionService } from '../lib/session';
import { nativeSessionConfig } from '../lib/platform/native/sessionConfig';
import { nativeSessionStorage } from '../lib/platform/native/sessionStorageAdapter';

const AuthContext = createContext();

const nativeAuthSessionService = createAuthSessionService({
  authClient,
  profileClient,
  sessionStorage: nativeSessionStorage,
  config: nativeSessionConfig,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const session = await nativeAuthSessionService.restoreSession();
        if (!cancelled) {
          setUser(session.user);
          setProfileInfo(session.profile);
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
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

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (identifier, password) => {
    try {
      const session = await nativeAuthSessionService.login(identifier, password);
      setUser(session.user);
      setProfileInfo(session.profile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await nativeAuthSessionService.signup(userData);
      if (response.message === 'User created successfully') {
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: 'Signup failed' };
    }
  };

  const logout = async () => {
    try {
      const session = await nativeAuthSessionService.logout();
      setUser(session.user);
      setProfileInfo(session.profile);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateProfileInfo = (newProfileInfo) => {
    setProfileInfo(newProfileInfo);
  };

  const value = {
    user,
    profileInfo,
    loading,
    login,
    signup,
    logout,
    updateProfileInfo,
    authDisabled: nativeSessionConfig.authDisabled,
    apiBaseUrl: nativeSessionConfig.baseUrl,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
