export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const MAX_SESSION_MS = 30 * 60 * 1000;
export const LAST_ACTIVITY_KEY = 'auth:lastActivity';

export function getSessionTimes(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { iat, exp } = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    if (!Number.isFinite(iat) || !Number.isFinite(exp) || exp <= iat) return null;
    return {
      issuedAt: iat * 1000,
      expiresAt: Math.min(exp * 1000, iat * 1000 + MAX_SESSION_MS)
    };
  } catch {
    return null;
  }
}

export function recordSessionActivity(token) {
  localStorage.setItem(LAST_ACTIVITY_KEY, JSON.stringify({ token, at: Date.now() }));
}

export function storeSession(token) {
  recordSessionActivity(token);
  localStorage.setItem('token', token);
}

export function clearStoredSession(token) {
  if (localStorage.getItem('token') !== token) return false;
  localStorage.removeItem('token');
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  return true;
}

export function getSessionDeadline(token) {
  const times = getSessionTimes(token);
  if (!times) return 0;
  let lastActivity = times.issuedAt;
  try {
    const stored = JSON.parse(localStorage.getItem(LAST_ACTIVITY_KEY));
    if (
      stored?.token === token &&
      Number.isFinite(stored.at) &&
      stored.at >= times.issuedAt &&
      stored.at <= Date.now()
    ) {
      lastActivity = stored.at;
    }
  } catch {
    // Um registo ausente ou inválido nunca pode prolongar a sessão.
  }
  return Math.min(times.expiresAt, lastActivity + IDLE_TIMEOUT_MS);
}

export function monitorSession(token, onExpire) {
  let timer;
  let ended = false;
  let lastRecorded = 0;
  const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];

  const check = () => {
    window.clearTimeout(timer);
    if (ended || localStorage.getItem('token') !== token) return false;
    const remaining = getSessionDeadline(token) - Date.now();
    if (remaining <= 0) {
      ended = true;
      onExpire();
      return false;
    }
    timer = window.setTimeout(check, remaining);
    return true;
  };

  const handleActivity = (event) => {
    const now = Date.now();
    if (!event.isTrusted || now - lastRecorded < 1000 || !check()) return;
    recordSessionActivity(token);
    lastRecorded = now;
    check();
  };

  const handleStorage = (event) => {
    if (event.key === LAST_ACTIVITY_KEY || event.key === 'token' || event.key === null) check();
  };

  activityEvents.forEach((event) => window.addEventListener(event, handleActivity, { passive: true, capture: true }));
  window.addEventListener('focus', check);
  window.addEventListener('storage', handleStorage);
  document.addEventListener('visibilitychange', check);
  check();

  return () => {
    ended = true;
    window.clearTimeout(timer);
    activityEvents.forEach((event) => window.removeEventListener(event, handleActivity, true));
    window.removeEventListener('focus', check);
    window.removeEventListener('storage', handleStorage);
    document.removeEventListener('visibilitychange', check);
  };
}
