import { apiRequest } from './httpClient';
import { clearStoredAuthToken, setStoredAuthToken } from './runtime';

export const authClient = {
  login(email, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  signup(userData) {
    return apiRequest('/api/auth/signup', {
      method: 'POST',
      body: userData,
    });
  },

  me() {
    return apiRequest('/api/auth/me', { auth: true });
  },

  async storeSessionToken(token) {
    await setStoredAuthToken(token);
  },

  async clearSessionToken() {
    await clearStoredAuthToken();
  },
};
