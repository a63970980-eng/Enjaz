import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Offline proof for the consent-gated PostHog integration.
 *
 * The real handlers exported by src/analytics.ts are executed with an in-memory client,
 * the real before_send hook is applied to realistic SDK payloads, and network delivery is
 * denied outright. No data leaves the process.
 */

const networkAttempts = [];
globalThis.fetch = (...args) => {
  networkAttempts.push(String(args[0]?.url || args[0] || 'fetch'));
  throw new Error('network delivery is denied in offline verification');
};

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const CONSENT_KEY = 'ENJAZ_ANALYTICS_CONSENT';
const TOKEN = 'synthetic-project-token-for-tests';
const HOST = 'https://posthog.invalid';
const WORKSPACE = '3f1c2e6a-9b4d-4f6e-8a11-2c5d7e9b0a13';
const USER = '9a7b6c5d-4e3f-4a2b-8c1d-0e9f8a7b6c5d';
const SENSITIVE = {
  email: 'sentinel.user@example.com',
  password: 'Sentinel-Password-123',
  apiToken: 'phc_sentinel_should_never_leave',
  card: '4111111111111111',
  url: 'https://app.enjaz.example/workspace?token=sentinel#secret',
};

let scenario = 0;
async function freshAnalytics() {
  // A fresh module instance per scenario keeps the singleton client isolated.
  return import(new URL(`../src/analytics.ts?scenario=${scenario++}`, import.meta.url).href);
}

function fakeClient(overrides = {}) {
  const calls = { init: [], capture: [], identify: [], reset: 0, optIn: 0, optOut: 0 };
  const client = {
    calls,
    init(token, config) { calls.init.push({ token, config }); },
    capture(event, properties) { calls.capture.push({ event, properties }); },
    identify(distinctId) { calls.identify.push(distinctId); },
    reset() { calls.reset += 1; },
    opt_in_capturing() { calls.optIn += 1; },
    opt_out_capturing() { calls.optOut += 1; },
    ...overrides,
  };
  return client;
}

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
  };
}

async function start(options = {}) {
  const analytics = await freshAnalytics();
  const client = options.client || fakeClient();
  const storage = options.storage || memoryStorage({ [CONSENT_KEY]: 'granted' });
  const initialized = analytics.initAnalytics({ client, token: TOKEN, host: HOST, storage, ...options.overrides });
  return { analytics, client, storage, initialized };
}

test('missing project token or host keeps analytics off with no client side effects', async () => {
  const noToken = await start({ overrides: { token: '' } });
  assert.equal(noToken.initialized, false);
  assert.equal(noToken.client.calls.init.length, 0);
  assert.equal(noToken.analytics.analytics.employeeCreated({ workspaceId: WORKSPACE }), false);
  assert.equal(noToken.client.calls.capture.length, 0);

  const noHost = await start({ overrides: { host: '' } });
  assert.equal(noHost.initialized, false);
  assert.equal(noHost.client.calls.init.length, 0);

  const rejectedHost = await start({ overrides: { host: 'posthog.invalid' } });
  assert.equal(rejectedHost.initialized, false);

  const secretKey = await start({ overrides: { token: 'phx_personal_api_key_sentinel' } });
  assert.equal(secretKey.initialized, false);
  assert.equal(secretKey.client.calls.init.length, 0);
});

test('no consent decision means fully opted out and nothing is captured', async () => {
  const { analytics, client, initialized } = await start({ storage: memoryStorage() });
  assert.equal(initialized, true);
  assert.equal(client.calls.optOut, 1);
  assert.equal(client.calls.optIn, 0);
  assert.equal(analytics.analytics.employeeCreated({ workspaceId: WORKSPACE, roleCode: 'sales.rep' }), false);
  assert.equal(analytics.analytics.taskCreated({ workspaceId: WORKSPACE }), false);
  assert.equal(analytics.analytics.taskRunStarted({ workspaceId: WORKSPACE }), false);
  assert.equal(analytics.analytics.approvalDecided({ workspaceId: WORKSPACE, decision: 'approve' }), false);
  assert.equal(client.calls.capture.length, 0);
  assert.equal(analytics.identifyAnalyticsUser(USER), false);
  assert.equal(client.calls.identify.length, 0);
});

test('a denied decision stays off until the member grants it', async () => {
  const storage = memoryStorage({ [CONSENT_KEY]: 'denied' });
  const { analytics, client } = await start({ storage });
  assert.equal(client.calls.optOut, 1);
  assert.equal(analytics.analytics.taskRunStarted({ workspaceId: WORKSPACE, taskStatus: 'queued' }), false);
  assert.equal(client.calls.capture.length, 0);

  analytics.setAnalyticsConsent('granted', storage);
  assert.equal(storage.data.get(CONSENT_KEY), 'granted');
  assert.equal(client.calls.optIn, 1);
  assert.equal(analytics.analytics.taskRunStarted({ workspaceId: WORKSPACE, taskStatus: 'queued' }), true);
  assert.equal(client.calls.capture.length, 1);
  assert.equal(client.calls.capture[0].event, 'task_run_started');

  analytics.setAnalyticsConsent('denied', storage);
  assert.equal(client.calls.optOut, 2);
  assert.equal(client.calls.reset, 1);
  assert.equal(analytics.analytics.taskRunStarted({ workspaceId: WORKSPACE }), false);
  assert.equal(client.calls.capture.length, 1);
});

test('each real action emits exactly one allowlisted event', async () => {
  const { analytics, client } = await start();
  assert.equal(analytics.analytics.employeeCreated({ workspaceId: WORKSPACE, roleCode: 'marketing.specialist', toolCount: 3, ...SENSITIVE }), true);
  assert.equal(analytics.analytics.taskCreated({ workspaceId: WORKSPACE, roleCode: 'marketing.specialist', objectiveLength: 120, ...SENSITIVE }), true);
  assert.equal(analytics.analytics.taskRunStarted({ workspaceId: WORKSPACE, roleCode: 'marketing.specialist', taskStatus: 'queued', ...SENSITIVE }), true);
  assert.equal(analytics.analytics.approvalDecided({ workspaceId: WORKSPACE, decision: 'approve', ...SENSITIVE }), true);

  assert.equal(client.calls.capture.length, 4);
  assert.deepEqual(client.calls.capture.map(call => call.event), [
    'employee_created', 'task_created', 'task_run_started', 'approval_decided',
  ]);
  assert.deepEqual(client.calls.capture[0].properties, {
    workspace_id: WORKSPACE,
    role_code: 'marketing.specialist',
    tool_count: 3,
    surface: 'employee_builder',
  });
  assert.deepEqual(client.calls.capture[1].properties, {
    workspace_id: WORKSPACE,
    role_code: 'marketing.specialist',
    objective_length_bucket: 'short',
  });
  assert.deepEqual(client.calls.capture[2].properties, {
    workspace_id: WORKSPACE,
    role_code: 'marketing.specialist',
    task_status: 'queued',
  });
  assert.deepEqual(client.calls.capture[3].properties, { workspace_id: WORKSPACE, decision: 'approve' });

  const payload = JSON.stringify(client.calls.capture);
  for (const sentinel of [SENSITIVE.email, SENSITIVE.password, SENSITIVE.apiToken, SENSITIVE.card]) {
    assert.equal(payload.includes(sentinel), false, `sensitive value leaked: ${sentinel}`);
  }
  assert.doesNotMatch(payload, /@|phc_|4111111111111111|sentinel/i);
});

test('invalid identifiers and values are dropped instead of truncated', async () => {
  const { analytics, client } = await start();
  analytics.analytics.employeeCreated({
    workspaceId: SENSITIVE.email,
    roleCode: SENSITIVE.email,
    toolCount: -4,
    surface: 'not-a-surface',
  });
  analytics.analytics.approvalDecided({ workspaceId: WORKSPACE, decision: 'maybe' });
  assert.equal(client.calls.capture.length, 2);
  // The builder action always records its own surface; every other invalid value is dropped.
  assert.deepEqual(client.calls.capture[0].properties, { surface: 'employee_builder' });
  assert.deepEqual(client.calls.capture[1].properties, { workspace_id: WORKSPACE });
});

test('the configured before_send hook strips URL, referrer and person metadata', async () => {
  const { client } = await start();
  const config = client.calls.init[0].config;
  assert.equal(typeof config.before_send, 'function');

  const scrubbed = config.before_send({
    event: '$pageview',
    properties: {
      token: TOKEN,
      $current_url: SENSITIVE.url,
      $referrer: 'https://mail.example.com/?email=sentinel.user@example.com',
      $set: { email: SENSITIVE.email },
      $set_once: { name: 'Sentinel User' },
      email: SENSITIVE.email,
      password: SENSITIVE.password,
      card: SENSITIVE.card,
      workspace_id: WORKSPACE,
      decision: 'approve',
    },
    $set: { email: SENSITIVE.email },
  });
  assert.deepEqual(scrubbed.properties, { token: TOKEN, workspace_id: WORKSPACE, decision: 'approve' });

  // A real public project token keeps its documented prefix and must survive for delivery.
  const publicShaped = `phc_${'0'.repeat(24)}`;
  const delivery = config.before_send({ event: 'employee_created', properties: { token: publicShaped, $current_url: SENSITIVE.url } });
  assert.equal(delivery.properties.token, publicShaped);
  assert.equal('$current_url' in delivery.properties, false);
  assert.equal(scrubbed.$set, undefined);
  assert.equal(scrubbed.$set_once, undefined);
  const serialized = JSON.stringify(scrubbed);
  assert.doesNotMatch(serialized, /sentinel|example\.com|4111111111111111|mail\.example/i);
});

test('SDK and transport failures never break the product result', async () => {
  const throwingTransport = await start({
    client: fakeClient({ capture() { throw new Error('transport offline'); } }),
  });
  assert.equal(throwingTransport.analytics.analytics.taskCreated({ workspaceId: WORKSPACE }), false);
  assert.equal(throwingTransport.analytics.analytics.approvalDecided({ workspaceId: WORKSPACE, decision: 'reject' }), false);

  const failingInit = await start({ client: fakeClient({ init() { throw new Error('bad config'); } }) });
  assert.equal(failingInit.initialized, false);
  assert.equal(failingInit.analytics.analytics.employeeCreated({ workspaceId: WORKSPACE }), false);

  const failingConsent = await start({ client: fakeClient({ opt_in_capturing() { throw new Error('storage denied'); } }) });
  assert.equal(failingConsent.initialized, true);
  assert.equal(networkAttempts.length, 0);
});

test('identity is an opaque auth id and is reset on sign-out', async () => {
  const { analytics, client } = await start();
  assert.equal(analytics.identifyAnalyticsUser(USER), true);
  assert.deepEqual(client.calls.identify, [USER]);
  assert.equal(analytics.identifyAnalyticsUser(SENSITIVE.email), false);
  assert.equal(analytics.identifyAnalyticsUser(SENSITIVE.apiToken), false);
  assert.deepEqual(client.calls.identify, [USER]);

  analytics.resetAnalyticsIdentity();
  assert.equal(client.calls.reset, 1);

  const anonymous = await start({ storage: memoryStorage() });
  assert.equal(anonymous.analytics.identifyAnalyticsUser(USER), false);
  assert.equal(anonymous.client.calls.identify.length, 0);
});

test('the client is configured with privacy defaults and no automatic collection', async () => {
  const { client } = await start();
  assert.equal(client.calls.init.length, 1);
  const [init] = client.calls.init;
  assert.equal(init.token, TOKEN);
  assert.equal(init.config.api_host, HOST);
  assert.equal(init.config.autocapture, false);
  assert.equal(init.config.capture_pageview, false);
  assert.equal(init.config.capture_pageleave, false);
  assert.equal(init.config.capture_dead_clicks, false);
  assert.equal(init.config.capture_exceptions, false);
  assert.equal(init.config.disable_session_recording, true);
  assert.equal(init.config.disable_surveys, true);
  assert.equal(init.config.enable_heatmaps, false);
  assert.equal(init.config.advanced_disable_flags, true);
  assert.equal(init.config.person_profiles, 'never');
  assert.equal(init.config.opt_out_capturing_by_default, true);
});

test('WorkspaceApp handlers call the instrumented analytics contract', async () => {
  const source = await readFile(new URL('../src/WorkspaceApp.tsx', import.meta.url), 'utf8');
  assert.match(source, /from '\.\/analytics'/);
  assert.match(source, /import AnalyticsConsentNotice from '\.\/AnalyticsConsentNotice'/);
  assert.match(source, /initAnalytics\(\)/);
  assert.match(source, /identifyAnalyticsUser\(analyticsUserId\)/);
  assert.match(source, /resetAnalyticsIdentity\(\)/);
  assert.match(source, /analytics\.employeeCreated\(\{/);
  assert.match(source, /analytics\.taskCreated\(\{/);
  assert.match(source, /analytics\.taskRunStarted\(\{/);
  assert.match(source, /analytics\.approvalDecided\(\{/);
  assert.match(source, /<AnalyticsConsentNotice decision=\{analyticsConsent\} onDecision=\{decideAnalytics\} \/>/);
});

test('the example environment declares an empty public token and an explicit host', async () => {
  const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  assert.match(example, /^VITE_POSTHOG_PROJECT_TOKEN=$/m);
  assert.match(example, /^VITE_POSTHOG_HOST=https:\/\/us\.i\.posthog\.com$/m);
  assert.doesNotMatch(example, /phc_[A-Za-z0-9]{10,}/);
});

test('local env files stay ignored while the example stays tracked', async () => {
  const ignore = await readFile(new URL('../../../.gitignore', import.meta.url), 'utf8');
  assert.match(ignore, /^\.env$/m);
  assert.match(ignore, /^\.env\.\*$/m);
  assert.match(ignore, /^!\.env\.example$/m);
});

test('the SDK importer pins posthog-js and the original lock resolves it', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.name, 'enjaz-platform');
  assert.equal(manifest.dependencies['posthog-js'], '1.438.13');

  const lock = await readFile(new URL('../../../pnpm-lock.yaml', import.meta.url), 'utf8');
  assert.match(lock, /^lockfileVersion: '9\.0'$/m);
  const importer = lock.split('\n  apps/web:\n')[1] || '';
  assert.match(importer, /^\s+posthog-js:\n\s+specifier: 1\.438\.13\n\s+version: 1\.438\.13/m);
  assert.match(lock, /^  posthog-js@1\.438\.13:/m);

  for (const foreignLock of ['yarn.lock', 'package-lock.json', 'bun.lockb', 'bun.lock']) {
    await assert.rejects(access(new URL(`../../../${foreignLock}`, import.meta.url)), { code: 'ENOENT' });
  }

  const apiManifest = JSON.parse(await readFile(new URL('../../../services/api/package.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(apiManifest.dependencies).includes('posthog-js'), false);
  assert.equal(Object.keys(apiManifest.dependencies).includes('posthog-node'), false);
});

test('no real PostHog token literal exists in the changed sources', async () => {
  const sources = [
    '../src/analytics.ts',
    '../src/AnalyticsConsentNotice.tsx',
    '../src/WorkspaceApp.tsx',
    '../.env.example',
    './posthog-analytics.test.mjs',
  ];
  for (const relative of sources) {
    const contents = await readFile(new URL(relative, import.meta.url), 'utf8');
    assert.doesNotMatch(contents, /phc_[A-Za-z0-9]{10,}/, `token literal in ${relative}`);
    assert.doesNotMatch(contents, /phx_[A-Za-z0-9]{10,}/, `personal key literal in ${relative}`);
  }
  const analyticsSource = await readFile(new URL('../src/analytics.ts', import.meta.url), 'utf8');
  assert.match(analyticsSource, /VITE_POSTHOG_PROJECT_TOKEN/);
  assert.match(analyticsSource, /VITE_POSTHOG_HOST/);
  assert.equal(networkAttempts.length, 0);
  assert.equal(webRoot.endsWith('apps/web/'), true);
  assert.equal(repoRoot.includes('apps/'), false);
});
