const AUTH_KEY = 'fuchibol_auth';

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(payload) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
