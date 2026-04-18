// Web app — API base (Vite)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/** When true, login/signup routes are not used; loads dev user from profile API. */
export const AUTH_DISABLED = true;

/** Placeholder until real auth; backend auto-creates this user on first profile request. */
export const DEV_USER_EMAIL = 'dev@musicratingapp.local';

export default API_BASE_URL;
