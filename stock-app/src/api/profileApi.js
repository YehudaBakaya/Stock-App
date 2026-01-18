const API_BASE = 'http://localhost:5001/api';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const getMe = () => request('/me');
export const updateMe = (payload) =>
  request('/me', { method: 'PUT', body: JSON.stringify(payload) });
export const changePassword = (payload) =>
  request('/me/change-password', { method: 'POST', body: JSON.stringify(payload) });
export const listApiKeys = () => request('/me/api-keys');
export const createApiKey = (payload) =>
  request('/me/api-keys', { method: 'POST', body: JSON.stringify(payload) });
export const revokeApiKey = (id) =>
  request(`/me/api-keys/${id}`, { method: 'DELETE' });
