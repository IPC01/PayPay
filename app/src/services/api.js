import { getSessionDeadline, getSessionTimes } from '../helpers/authSession';

export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/$/, '');
export const API_PREFIX = '/api';
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

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

export async function request(path, { method = 'GET', body, token, headers = {}, responseType, skipSessionCheck = false } = {}) {
  if (token && !skipSessionCheck && getSessionDeadline(token) <= Date.now()) {
    const code = getSessionTimes(token)?.expiresAt > Date.now() ? 'SESSION_IDLE' : 'SESSION_EXPIRED';
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { token, code } }));
    const error = new Error('Sessão expirada. Inicie sessão novamente.');
    error.status = 401;
    error.code = code;
    throw error;
  }
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
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    // Um 401 num pedido autenticado significa que a sessão expirou ou foi revogada
    if (response.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { token } }));
    }
    const error = new Error(data.error || data.message || response.statusText);
    error.status = response.status;
    error.code = data.code;
    if (data.retryAfter) error.retryAfter = data.retryAfter;
    throw error;
  }

  if (responseType === 'blob') return response.blob();
  return response.json().catch(() => ({}));
}

export async function openAuthenticatedFile(path) {
  const popup = window.open('about:blank', '_blank');
  if (!popup) throw new Error('Permita pop-ups para abrir o documento KYC.');
  popup.opener = null;

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Inicie sessão novamente para abrir o documento.');
    const blob = await request(path, { token, responseType: 'blob' });
    const objectUrl = URL.createObjectURL(blob);
    popup.location.replace(objectUrl);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    popup.close();
    throw error;
  }
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
