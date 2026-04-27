import { getApiBaseUrl, getStoredAuthToken } from './runtime';

const isPlainObject = (value) =>
  value != null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !(value instanceof FormData);

const buildUrl = (path, query) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue;
      if (Array.isArray(value)) {
        value.forEach((entry) => url.searchParams.append(key, String(entry)));
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

const parseResponse = async (response) => {
  const raw = await response.text();
  if (!raw) {
    return { data: null, raw };
  }

  try {
    return { data: JSON.parse(raw), raw };
  } catch {
    return { data: raw, raw };
  }
};

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    auth = false,
  } = options;

  const requestHeaders = { ...headers };
  let requestBody = body;

  if (auth) {
    const token = await getStoredAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  if (isPlainObject(body)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const { data, raw } = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(
      (data && typeof data === 'object' && data.message) ||
        (typeof data === 'string' && data) ||
        response.statusText ||
        'Request failed'
    );
    error.status = response.status;
    error.data = data;
    error.raw = raw;
    throw error;
  }

  return data;
}
