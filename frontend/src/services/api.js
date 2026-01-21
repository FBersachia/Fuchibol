import { getAuth, clearAuth } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE}${path}`;
}

export async function apiFetch(path, options = {}) {
  const { token } = getAuth() || {};
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const groupId = localStorage.getItem('fuchibol_group_id');
  if (groupId && !headers.has('X-Group-Id')) {
    headers.set('X-Group-Id', groupId);
  }

  const res = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = res.status === 204 ? null : isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (payload && (payload.error || payload.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload;
}
