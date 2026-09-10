export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/$/, '');
export const API_PREFIX = '/api';

export function apiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalizedPath === API_PREFIX || normalizedPath.startsWith(`${API_PREFIX}/`)
    ? normalizedPath
    : `${API_PREFIX}${normalizedPath}`;

  return `${API_BASE}${apiPath}`;
}

export function assetUrl(url) {
  if (!url) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname.startsWith('/uploads/')) {
        return `${API_BASE}${API_PREFIX}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      }
    } catch (error) {
      return url;
    }
    return url;
  }

  if (url.startsWith('//')) {
    const scheme = API_BASE.startsWith('https') ? 'https:' : 'http:';
    return `${scheme}${url}`;
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  if (normalizedPath.startsWith('/api/uploads/')) return `${API_BASE}${normalizedPath}`;
  if (normalizedPath.startsWith('/uploads/')) return `${API_BASE}${API_PREFIX}${normalizedPath}`;

  return `${API_BASE}${normalizedPath}`;
}

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

  const response = await fetch(apiUrl(path), config);
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
