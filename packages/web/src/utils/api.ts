export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3002/api';

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    if (res.status >= 500) {
      window.location.href = '/error';
      throw new Error('Critical Server Error');
    }

    return res;
  } catch (error) {

    window.location.href = '/error';
    throw error;
  }
};