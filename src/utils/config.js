// Configuration for API endpoints
// Change this to your computer's IP address when testing on physical device
const API_BASE_URL = 'http://192.168.1.99:5001'; // For mobile access
// const API_BASE_URL = 'http://localhost:5001'; // For iOS Simulator

/** When true, login/signup screens are skipped; app loads this user via profile API. */
export const AUTH_DISABLED = true;

/** Placeholder until real auth; backend auto-creates this user on first profile request. */
export const DEV_USER_EMAIL = 'dev@musicratingapp.local';

/** Optional: if profile fetch fails, diary APIs still work when set to a real User _id string. */
export const DEV_USER_ID = '';

export default API_BASE_URL;
