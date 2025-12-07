export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3002/api';

  const res = await fetch(`${BASE_URL}${endpoint}`, options);

  // Only redirect on truly critical server errors (5xx) that the user can't recover from
  // Let 4xx errors (validation, auth, etc.) be handled by the calling component
  if (res.status >= 500) {
    console.error(`[fetchApi] Server error ${res.status} on ${endpoint}`);
    // Don't auto-redirect - throw instead so component can handle gracefully
    throw new Error(`Error del servidor (${res.status})`);
  }

  return res;
};