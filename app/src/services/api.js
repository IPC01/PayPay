export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const config = {
    method,
    headers: {
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || response.statusText);
  }

  return data;
}
