import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// This suite creates disposable accounts only in a local Wrangler database.
const base = new URL(process.env.FRUGAL_TEST_ORIGIN || 'http://127.0.0.1:8788');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'API tests must target a local database');
assert.equal(base.protocol, 'http:');
const run = randomUUID();
const password = randomUUID() + 'aA1!';
const users = [];
let requestCount = 0;
async function request(path, { method = 'GET', body, cookie, origin = base.origin, ip, raw } = {}) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      // Wrangler local tests do not have a Cloudflare edge; provide isolated fixture IPs.
      'CF-Connecting-IP': ip || `192.0.2.${++requestCount % 200 + 1}`,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    redirect: 'manual',
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { response, data };
}
function status(result, code, context) {
  assert.equal(result.response.status, code, `${context}: received ${result.response.status} ${JSON.stringify(result.data)}`);
  assert.equal(result.response.headers.get('cache-control'), 'no-store');
}
async function signUp(index) {
  const result = await request('/api/auth/sign-up/email', { method: 'POST', body: {
    name: `Fixture ${index}`, email: `frugal-${run}-${index}@example.test`, password,
  } });
  status(result, 200, 'Signup');
  const cookie = result.response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  assert(cookie, 'Signup must establish a browser session');
  assert(result.response.headers.getSetCookie().some((value) => /HttpOnly/i.test(value)), 'Session cookie must be HttpOnly');
  assert(result.response.headers.getSetCookie().some((value) => /SameSite=Lax/i.test(value)), 'Session cookie must use SameSite');
  const user = { id: result.data.user.id, email: result.data.user.email, cookie };
  users.push(user);
  return user;
}
const snapshot = {
  budgetHistory: [{ amount: 500, effectiveFrom: '2026-10-30', updatedAt: '2026-10-30T12:00:00.000Z' }],
  expenses: [{ id: 'fixture-expense', amount: 12.5, category: 'dining', description: 'Synthetic fixture', date: '2026-10-30', createdAt: '2026-10-30T12:00:00.000Z' }],
  recurringExpenses: [], oneOffExpenses: [], settings: { displayName: 'Fixture', weekStartDay: 1 },
};
const unauth = await request('/api/state?ownerId=someone');
status(unauth, 401, 'Anonymous access');
const a = await signUp('a');
const b = await signUp('b');
let result = await request('/api/auth/get-session', { cookie: a.cookie });
status(result, 200, 'Session lookup');
assert.equal(result.data.user.id, a.id);
result = await request(`/api/state?ownerId=${a.id}`, { cookie: a.cookie });
status(result, 200, 'New account state');
assert.deepEqual(result.data, { revision: 0, data: null });
const mutation = { ownerId: a.id, revision: 0, mutationId: randomUUID(), data: snapshot };
result = await request('/api/state', { method: 'PUT', cookie: a.cookie, body: mutation });
status(result, 200, 'First save');
assert.equal(result.data.revision, 1);
result = await request('/api/state', { method: 'PUT', cookie: a.cookie, body: mutation });
status(result, 200, 'Lost-response exact retry');
assert.equal(result.data.revision, 1, 'Replay must not increment the revision');
result = await request('/api/state', { method: 'PUT', cookie: a.cookie, body: { ...mutation, data: { ...snapshot, expenses: [] } } });
status(result, 409, 'Mutation ID cannot be reused with different data');
result = await request('/api/state', { method: 'PUT', cookie: a.cookie, body: { ...mutation, mutationId: randomUUID() } });
status(result, 409, 'Stale write');
result = await request(`/api/state?ownerId=${a.id}`, { cookie: a.cookie });
status(result, 200, 'Saved snapshot');
assert.equal(result.data.revision, 1);
assert.deepEqual(result.data.data, snapshot);
result = await request(`/api/state?ownerId=${b.id}`, { cookie: b.cookie });
status(result, 200, 'Second account remains empty');
assert.deepEqual(result.data, { revision: 0, data: null });
result = await request(`/api/state?ownerId=${a.id}`, { cookie: b.cookie });
status(result, 403, 'Cross-account read');
result = await request('/api/state', { method: 'PUT', cookie: b.cookie, body: { ...mutation, mutationId: randomUUID() } });
status(result, 403, 'Cross-account write and stale-tab cookie switch');
result = await request('/api/state', { method: 'PUT', cookie: a.cookie, origin: 'https://untrusted.example', body: { ...mutation, revision: 1, mutationId: randomUUID() } });
status(result, 403, 'Cross-origin write');
result = await request('/api/state', { method: 'PUT', cookie: a.cookie, raw: '{invalid' });
status(result, 400, 'Malformed JSON');
for (const bad of [
  { ...snapshot, expenses: [{ ...snapshot.expenses[0], date: '2026-02-30' }] },
  { ...snapshot, expenses: [{ ...snapshot.expenses[0], amount: -1 }] },
  { ...snapshot, expenses: [{ ...snapshot.expenses[0], category: 'unknown' }] },
  { ...snapshot, expenses: [snapshot.expenses[0], snapshot.expenses[0]] },
  { ...snapshot, settings: { displayName: 'Fixture', weekStartDay: 7 } },
  { ...snapshot, userId: b.id },
]) {
  result = await request('/api/state', { method: 'PUT', cookie: a.cookie, body: { ...mutation, revision: 1, mutationId: randomUUID(), data: bad } });
  status(result, 400, 'Invalid snapshot');
}
result = await request('/api/state', { method: 'PUT', cookie: a.cookie, body: { ...mutation, revision: 1, mutationId: randomUUID(), data: { ...snapshot, expenses: [] } } });
status(result, 200, 'Delete-all snapshot is persisted');
assert.equal(result.data.revision, 2);
result = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: a.email, password: randomUUID() } });
assert([400, 401].includes(result.response.status), 'Incorrect password must not authenticate');
result = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: a.email, password } });
status(result, 200, 'Sign in');
assert.equal(result.data.user.id, a.id);
result = await request('/api/auth/sign-up/email', { method: 'POST', origin: 'https://untrusted.example', body: { email: 'bad@example.test', password, name: 'Fixture' } });
status(result, 403, 'Cross-origin signup');
result = await request('/api/auth/delete-user', { method: 'POST', cookie: a.cookie, body: {} });
status(result, 404, 'Unneeded auth endpoint is unavailable');
const ip = '198.51.100.23';
for (let i = 0; i < 9; i++) {
  result = await request('/api/auth/sign-in/email', { method: 'POST', ip, body: { email: 'missing@example.test', password: randomUUID() } });
}
status(result, 429, 'Authentication rate limit');
for (const user of users) {
  result = await request('/api/auth/sign-out', { method: 'POST', cookie: user.cookie, body: {} });
  status(result, 200, 'Sign out');
  result = await request(`/api/state?ownerId=${user.id}`, { cookie: user.cookie });
  status(result, 401, 'Revoked session');
}
console.log('PASS: real signup/login, cookie session, account isolation, cross-origin guards, CAS/replay/conflicts, invalid input, deletion persistence, rate limiting, signout');
