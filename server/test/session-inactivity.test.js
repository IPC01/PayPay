const test = require('node:test');
const assert = require('node:assert/strict');

const sessionModule = import('../../app/src/helpers/authSession.js');
const MINUTE = 60 * 1000;

function fakeBrowser(t) {
  let now = 2000000000000;
  let timerId = 0;
  const timers = new Map();
  const storage = new Map();
  const eventTarget = () => {
    const listeners = new Map();
    return {
      addEventListener(type, callback) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(callback);
      },
      removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
      dispatch(type, event = {}) {
        for (const callback of listeners.get(type) || []) callback({ isTrusted: true, ...event });
      }
    };
  };
  const window = {
    ...eventTarget(),
    setTimeout(callback, delay) {
      timers.set(++timerId, { at: now + delay, callback });
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); }
  };
  const document = eventTarget();
  const localStorage = {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const cleanups = [];
  const originals = new Map();
  for (const [name, value] of Object.entries({ window, document, localStorage })) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { value, configurable: true });
  }
  t.after(() => {
    cleanups.forEach((cleanup) => cleanup());
    for (const [name, original] of originals) {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    }
  });
  t.mock.method(Date, 'now', () => now);

  const token = (ttl = 30 * MINUTE) => {
    const claims = { iat: Math.floor(now / 1000), exp: Math.floor((now + ttl) / 1000) };
    return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
  };
  const advance = (milliseconds) => {
    const until = now + milliseconds;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].callback();
    }
    now = until;
  };
  return {
    window, document, localStorage, token, advance, timers,
    jump: (ms) => { now += ms; },
    cleanup: (callback) => cleanups.push(callback)
  };
}

test('session expires at exactly 15 minutes without activity, regardless of polling', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const token = browser.token();
  session.storeSession(token);
  const deadline = Date.now() + 15 * MINUTE;
  let expirations = 0;
  const stop = session.monitorSession(token, () => { expirations += 1; });
  browser.cleanup(stop);

  for (let minute = 0; minute < 14; minute += 1) {
    browser.advance(MINUTE);
    assert.equal(session.getSessionDeadline(token), deadline);
  }
  browser.advance(MINUTE - 1);
  assert.equal(expirations, 0);
  browser.advance(1);
  assert.equal(expirations, 1);
  browser.advance(15 * MINUTE);
  assert.equal(expirations, 1);
});

test('real activity renews only the idle deadline, never the absolute 30-minute limit', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const token = browser.token();
  const startedAt = Date.now();
  session.storeSession(token);
  let expired = false;
  const stop = session.monitorSession(token, () => { expired = true; });
  browser.cleanup(stop);

  browser.advance(14 * MINUTE);
  browser.window.dispatch('pointerdown');
  assert.equal(session.getSessionDeadline(token), startedAt + 29 * MINUTE);
  browser.advance(14 * MINUTE);
  browser.window.dispatch('keydown');
  assert.equal(session.getSessionDeadline(token), startedAt + 30 * MINUTE);
  browser.advance(2 * MINUTE - 1);
  assert.equal(expired, false);
  browser.advance(1);
  assert.equal(expired, true);
});

test('reloading the application preserves the previous idle deadline', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const token = browser.token();
  session.storeSession(token);
  const stopFirst = session.monitorSession(token, () => assert.fail('First monitor should be stopped'));
  browser.advance(10 * MINUTE);
  stopFirst();
  let expired = false;
  const stopSecond = session.monitorSession(token, () => { expired = true; });
  browser.cleanup(stopSecond);
  browser.advance(5 * MINUTE);
  assert.equal(expired, true);
});

test('activity shared by another tab updates the deadline for the same session', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const token = browser.token();
  session.storeSession(token);
  let expired = false;
  const stop = session.monitorSession(token, () => { expired = true; });
  browser.cleanup(stop);

  browser.advance(14 * MINUTE);
  session.recordSessionActivity(token);
  browser.window.dispatch('storage', { key: session.LAST_ACTIVITY_KEY });
  browser.advance(15 * MINUTE - 1);
  assert.equal(expired, false);
  browser.advance(1);
  assert.equal(expired, true);
});

test('returning from suspension expires the session before accepting new input', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const token = browser.token();
  session.storeSession(token);
  const originalActivity = browser.localStorage.getItem(session.LAST_ACTIVITY_KEY);
  let expired = false;
  const stop = session.monitorSession(token, () => { expired = true; });
  browser.cleanup(stop);
  browser.jump(16 * MINUTE);
  browser.window.dispatch('keydown');
  assert.equal(expired, true);
  assert.equal(browser.localStorage.getItem(session.LAST_ACTIVITY_KEY), originalActivity);
});

test('focus, visibility and synthetic events do not count as user activity', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const token = browser.token();
  session.storeSession(token);
  let expired = false;
  const stop = session.monitorSession(token, () => { expired = true; });
  browser.cleanup(stop);
  browser.advance(14 * MINUTE);
  browser.window.dispatch('focus');
  browser.document.dispatch('visibilitychange');
  browser.window.dispatch('pointermove', { isTrusted: false });
  browser.advance(MINUTE);
  assert.equal(expired, true);
});

test('stale monitors cannot expire a new login and cleanup removes timers', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const oldToken = browser.token();
  session.storeSession(oldToken);
  const stop = session.monitorSession(oldToken, () => assert.fail('Stale session expired'));
  browser.advance(MINUTE);
  const newToken = browser.token();
  session.storeSession(newToken);
  browser.window.dispatch('storage', { key: 'token' });
  browser.advance(15 * MINUTE);
  assert.equal(browser.localStorage.getItem('token'), newToken);
  assert.equal(session.clearStoredSession(oldToken), false);
  stop();
  assert.equal(browser.timers.size, 0);
});

test('legacy or invalid activity timestamps never grant a fresh idle window', async (t) => {
  const session = await sessionModule;
  const browser = fakeBrowser(t);
  const token = browser.token();
  const startedAt = Date.now();
  browser.localStorage.setItem('token', token);
  browser.advance(10 * MINUTE);
  assert.equal(session.getSessionDeadline(token), startedAt + 15 * MINUTE);
  browser.localStorage.setItem(session.LAST_ACTIVITY_KEY, JSON.stringify({ token, at: Date.now() + MINUTE }));
  assert.equal(session.getSessionDeadline(token), startedAt + 15 * MINUTE);
  browser.localStorage.setItem(session.LAST_ACTIVITY_KEY, 'invalid');
  assert.equal(session.getSessionDeadline(token), startedAt + 15 * MINUTE);
  assert.equal(session.getSessionDeadline('invalid-token'), 0);
});
