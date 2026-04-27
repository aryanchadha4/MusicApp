import { AUTH_SESSION_STORAGE_KEY } from '../session/constants';

export const AUTH_TOKEN_STORAGE_KEY = AUTH_SESSION_STORAGE_KEY;

const DEFAULT_API_BASE_URL = 'http://localhost:5001';

const runtime = {
  baseUrl: DEFAULT_API_BASE_URL,
  getToken: async () => '',
  setToken: async () => {},
  clearToken: async () => {},
};

export function configureApiRuntime(overrides = {}) {
  Object.assign(runtime, overrides);
}

export function getApiBaseUrl() {
  const value = typeof runtime.baseUrl === 'function' ? runtime.baseUrl() : runtime.baseUrl;
  return String(value || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export async function getStoredAuthToken() {
  return String((await runtime.getToken?.()) || '');
}

export async function setStoredAuthToken(token) {
  await runtime.setToken?.(token);
}

export async function clearStoredAuthToken() {
  await runtime.clearToken?.();
}
