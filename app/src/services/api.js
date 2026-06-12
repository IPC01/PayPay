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

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const api = {
  get(path, options = {}) {
    return request(path, { method: 'GET', token: options.token || getToken(), ...options });
  },
  post(path, body, options = {}) {
    return request(path, { method: 'POST', body, token: options.token || getToken(), ...options });
  },
  put(path, body, options = {}) {
    return request(path, { method: 'PUT', body, token: options.token || getToken(), ...options });
  },
  patch(path, body, options = {}) {
    return request(path, { method: 'PATCH', body, token: options.token || getToken(), ...options });
  },
  delete(path, body, options = {}) {
    return request(path, { method: 'DELETE', body, token: options.token || getToken(), ...options });
  }
};

export default api;
