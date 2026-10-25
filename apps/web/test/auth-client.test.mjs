import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Offline proof for the browser auth client.
 *
 * The real module is imported against stubbed globals and a recording fetch, so every
 * assertion covers the code that ships: which endpoint receives which request, what is
 * persisted in session storage, and how failures surface to the workspace UI.
 */

const SUPABASE = 'https://project.enjaz.test';
const PUBLISHABLE_KEY = 'sb_publishable_testonly';
const API_BASE = 'https://api.enjaz.test';
const APP_ORIGIN = 'https://app.enjaz.test';
const PAGE = `${APP_ORIGIN}/workspace.html`;

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    clear: () => data.clear(),
  };
}

let session;
let local;
let scenario = 0;

function installBrowserGlobals() {
  session = memoryStorage();
  local = memoryStorage({ ENJAZ_WORKSPACE_ID: 'workspace-1' });
  globalThis.sessionStorage = session;
  globalThis.localStorage = local;
  globalThis.location = { origin: APP_ORIGIN, pathname: '/workspace.html', href: PAGE, search: '', hash: '' };
  globalThis.history = { state: null, replaceState() {} };
  globalThis.window = {
    ENJAZ_SUPABASE_URL: SUPABASE,
    ENJAZ_SUPABASE_ANON_KEY: PUBLISHABLE_KEY,
  };
}

/** Fresh module instance so module-level session state cannot leak between scenarios. */
async function freshClient() {
  installBrowserGlobals();
  return import(new URL(`../auth-client.js?case=${scenario++}`, import.meta.url).href);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Records every request and answers from a per-test router. */
function recordFetch(route) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const call = { url: href, method: options.method || 'GET', headers: options.headers || {}, body: options.body ? JSON.parse(options.body) : null };
    calls.push(call);
    const handler = route(call);
    if (handler === undefined) throw new Error(`unexpected network call: ${call.method} ${href}`);
    return handler;
  };
  return calls;
}

const signupUrl = `${SUPABASE}/auth/v1/signup?redirect_to=${encodeURIComponent(PAGE)}`;
const recoverUrl = `${SUPABASE}/auth/v1/recover?redirect_to=${encodeURIComponent(PAGE)}`;
const bridgeUrl = `${SUPABASE}/functions/v1/enjaz-auth-bridge`;

test('signup goes straight to Supabase Auth and never to the missing profile bridge', async () => {
  const calls = recordFetch(call => {
    if (call.url === signupUrl) return json({ access_token: 'access-1', refresh_token: 'refresh-1', user: { id: 'auth-user-1' } });
    return undefined;
  });
  const { authClient } = await freshClient();

  const result = await authClient.signUp('Owner@Example.com ', 'S3cure-Password!', 'Salem');

  assert.equal(result.needsEmailConfirmation, false);
  assert.deepEqual(calls.map(call => `${call.method} ${call.url}`), [`POST ${signupUrl}`]);
  assert.deepEqual(calls[0].body, { email: 'owner@example.com', password: 'S3cure-Password!', data: { full_name: 'Salem' } });
  assert.equal(calls[0].headers.apikey, PUBLISHABLE_KEY);
  assert.equal(session.getItem('ENJAZ_ACCESS_TOKEN'), 'access-1');
  assert.equal(session.getItem('ENJAZ_REFRESH_TOKEN'), 'refresh-1');
  assert.ok(!calls.some(call => call.url.startsWith(bridgeUrl)), 'signup must not depend on the external bridge');
});

test('signup with email confirmation enabled reports the pending state without storing a session', async () => {
  recordFetch(call => {
    if (call.url === signupUrl) return json({ user: { id: 'auth-user-2' } });
    if (call.url.startsWith(`${SUPABASE}/auth/v1/token?grant_type=password`)) {
      return json({ code: 'email_not_confirmed', message: 'Email not confirmed' }, 400);
    }
    return undefined;
  });
  const { authClient } = await freshClient();

  const result = await authClient.signUp('new@example.com', 'S3cure-Password!', 'New Owner');

  assert.equal(result.needsEmailConfirmation, true);
  assert.equal(result.data, null);
  assert.equal(session.getItem('ENJAZ_ACCESS_TOKEN'), null);
  assert.equal(session.getItem('ENJAZ_PENDING_EMAIL'), 'new@example.com');
});

test('a rejected signup surfaces the localized reason and keeps no session', async () => {
  recordFetch(call => {
    if (call.url === signupUrl) return json({ code: 'user_already_exists', message: 'User already registered' }, 422);
    return undefined;
  });
  const { authClient } = await freshClient();

  await assert.rejects(() => authClient.signUp('taken@example.com', 'S3cure-Password!', 'Owner'), /هذا البريد الإلكتروني مسجل بالفعل/);
  assert.equal(session.getItem('ENJAZ_ACCESS_TOKEN'), null);
});

test('password recovery requests a Supabase recovery link that returns to the workspace page', async () => {
  const calls = recordFetch(call => (call.url === recoverUrl ? json({}) : undefined));
  const { authClient } = await freshClient();

  await authClient.requestPasswordReset(' Owner@Example.com ');

  assert.deepEqual(calls.map(call => `${call.method} ${call.url}`), [`POST ${recoverUrl}`]);
  assert.deepEqual(calls[0].body, { email: 'owner@example.com' });
});

test('setting a new password uses the recovery session token against Supabase Auth', async () => {
  const calls = recordFetch(call => (call.url === `${SUPABASE}/auth/v1/user` && call.method === 'PUT' ? json({ id: 'auth-user-1' }) : undefined));
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'recovery-access');

  await authClient.updatePassword('N3w-Password!');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer recovery-access');
  assert.deepEqual(calls[0].body, { password: 'N3w-Password!' });
});

test('a weak password from the recovery form is reported, not swallowed', async () => {
  recordFetch(call => (call.url === `${SUPABASE}/auth/v1/user` ? json({ code: 'weak_password', message: 'Password is too weak' }, 422) : undefined));
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'recovery-access');

  await assert.rejects(() => authClient.updatePassword('12345678'), /كلمة المرور لا تستوفي متطلبات الأمان/);
});

test('session truth is read from the API, not from the external bridge', async () => {
  const calls = recordFetch(call => {
    if (call.url === `${API_BASE}/api/v1/auth/me`) {
      return json({ data: { identity: { authId: 'auth-user-1' }, profile: { id: 'user-1', name: 'Salem' }, workspaces: [{ id: 'workspace-1', workspace_role: 'manager' }] } });
    }
    return undefined;
  });
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'access-1');

  const me = await authClient.me(API_BASE);

  assert.equal(me.profile.id, 'user-1');
  assert.equal(me.workspaces[0].workspace_role, 'manager');
  assert.deepEqual(calls.map(call => call.url), [`${API_BASE}/api/v1/auth/me`]);
  assert.equal(calls[0].headers.Authorization, 'Bearer access-1');
});

test('an expired access token is refreshed once before the API session call is repeated', async () => {
  let attempts = 0;
  const calls = recordFetch(call => {
    if (call.url === `${SUPABASE}/auth/v1/token?grant_type=refresh_token`) {
      return json({ access_token: 'access-2', refresh_token: 'refresh-2' });
    }
    if (call.url === `${API_BASE}/api/v1/auth/me`) {
      attempts += 1;
      if (attempts === 1) return json({ error: 'Authentication required' }, 401);
      return json({ data: { identity: { authId: 'auth-user-1' }, profile: { id: 'user-1' }, workspaces: [] } });
    }
    return undefined;
  });
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'expired-access');
  session.setItem('ENJAZ_REFRESH_TOKEN', 'refresh-1');

  const me = await authClient.me(API_BASE);

  assert.equal(me.profile.id, 'user-1');
  assert.deepEqual(calls.map(call => call.url), [
    `${API_BASE}/api/v1/auth/me`,
    `${SUPABASE}/auth/v1/token?grant_type=refresh_token`,
    `${API_BASE}/api/v1/auth/me`,
  ]);
  assert.equal(calls[2].headers.Authorization, 'Bearer access-2');
});

test('an invalid session resolves to signed-out instead of an error screen', async () => {
  recordFetch(call => (call.url === `${API_BASE}/api/v1/auth/me` ? json({ error: 'Authentication required' }, 401) : undefined));
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'revoked-access');

  assert.equal(await authClient.me(API_BASE), null);
});

test('the legacy bridge is only consulted when the API is unreachable', async () => {
  const calls = recordFetch(call => {
    if (call.url === `${API_BASE}/api/v1/auth/me`) throw new Error('network down');
    if (call.url === bridgeUrl) return json({ data: { profile: { id: 'legacy-user' }, workspaces: [] } });
    return undefined;
  });
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'access-1');

  const me = await authClient.me(API_BASE);

  assert.equal(me.profile.id, 'legacy-user');
  assert.deepEqual(calls.map(call => call.url), [`${API_BASE}/api/v1/auth/me`, bridgeUrl]);
});

test('workspace bootstrap is created by the API first', async () => {
  const calls = recordFetch(call => {
    if (call.url === `${API_BASE}/api/v1/onboarding/bootstrap`) {
      return json({ data: { created: true, workspaces: [{ id: 'workspace-9', workspace_role: 'manager' }] } }, 201);
    }
    return undefined;
  });
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'access-1');

  const created = await authClient.bootstrap(API_BASE, { name: 'Salem', organizationName: 'Enjaz', workspaceName: 'Main', sector: 'enterprise' });

  assert.equal(created.workspaces[0].id, 'workspace-9');
  assert.deepEqual(calls.map(call => call.url), [`${API_BASE}/api/v1/onboarding/bootstrap`]);
  assert.equal(calls[0].headers.Authorization, 'Bearer access-1');
  assert.equal(calls[0].body.organizationName, 'Enjaz');
});

test('signing out clears tokens, cached profile and the selected workspace', async () => {
  const { authClient } = await freshClient();
  session.setItem('ENJAZ_ACCESS_TOKEN', 'access-1');
  session.setItem('ENJAZ_REFRESH_TOKEN', 'refresh-1');
  session.setItem('ENJAZ_PENDING_EMAIL', 'owner@example.com');

  authClient.signOut();

  assert.equal(authClient.token(), '');
  assert.equal(session.getItem('ENJAZ_REFRESH_TOKEN'), null);
  assert.equal(session.getItem('ENJAZ_PENDING_EMAIL'), null);
  assert.equal(local.getItem('ENJAZ_WORKSPACE_ID'), null);
  assert.equal(globalThis.window.ENJAZ_ACCESS_TOKEN, '');
});
