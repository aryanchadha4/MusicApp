import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import API_BASE_URL, { AUTH_DISABLED, DEV_USER_EMAIL, DEV_USER_ID } from '../utils/config';

const AuthContext = createContext();

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
    const init = async () => {
      if (AUTH_DISABLED) {
        try {
          const profile = await authAPI.getProfile(DEV_USER_EMAIL, 'email');
          if (profile.message || profile.error) {
            console.warn(
              '[AUTH_DISABLED] Profile fetch failed:',
              profile.message,
              '— check API_BASE_URL, backend, and MongoDB. Dev user',
              DEV_USER_EMAIL,
              'is auto-created on first successful profile request.'
            );
            if (DEV_USER_ID) {
              setUser({
                id: DEV_USER_ID,
                username: 'dev',
                email: DEV_USER_EMAIL,
                token: '',
              });
              setProfileInfo(null);
            } else {
              setUser(null);
              setProfileInfo(null);
            }
          } else {
            setUser({
              id: profile.id,
              username: profile.username,
              email: profile.email,
              token: '',
            });
            setProfileInfo(profile);
          }
        } catch (e) {
          console.error('[AUTH_DISABLED] Failed to load dev profile:', e);
          setUser(null);
          setProfileInfo(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          try {
            const profileData = await authAPI.getProfile(parsed.email);
            setProfileInfo(profileData);
          } catch (error) {
            console.error('Failed to fetch profile:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await authAPI.login(identifier, password);
      if (response.token) {
        const userData = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          token: response.token,
        };

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        const profileData = await authAPI.getProfile(userData.email);
        setProfileInfo(profileData);

        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
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
    if (AUTH_DISABLED) {
      return;
    }
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setProfileInfo(null);
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
    authDisabled: AUTH_DISABLED,
    apiBaseUrl: API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
