
const isServer = import.meta.env.SSR;
const isProd = import.meta.env.PROD;

export const API_URL = (isServer && import.meta.env.SSR_API_URL)
  ? import.meta.env.SSR_API_URL
  : (import.meta.env.PUBLIC_API_URL || (isProd ? 'https://pcfix-baru-production.up.railway.app/api' : 'http://localhost:3002/api'));

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const BASE_URL = API_URL;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  
  if (options.body instanceof FormData) {
    delete (defaultHeaders as any)['Content-Type'];
  }

  
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        (defaultHeaders as any)['Authorization'] = `Bearer ${state.token}`;
      }
    } catch (e) {
      console.error("Error parsing auth token", e);
    }
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, mergedOptions);

  
  
  if (res.status >= 500) {
    console.error(`[fetchApi] Server error ${res.status} on ${endpoint}`);
    
    throw new Error(`Error del servidor (${res.status})`);
  }

  return res;
};