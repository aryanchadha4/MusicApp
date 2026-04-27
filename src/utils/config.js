// Configuration for API endpoints.
// Keep this React Native-safe (Hermes does not support `import.meta`).
// For physical devices, set this to your machine LAN IP, e.g. http://192.168.x.x:5001.
const API_BASE_URL = 'http://localhost:5001';

/** When true, login/signup screens are skipped; app loads this user via profile API. */
export const AUTH_DISABLED = false;

/** Placeholder until real auth; backend auto-creates this user on first profile request. */
export const DEV_USER_EMAIL = 'dev@musicratingapp.local';

/** Optional: if profile fetch fails, diary APIs still work when set to a real User _id string. */
export const DEV_USER_ID = '';

export default API_BASE_URL;
