import test from 'node:test';
import assert from 'node:assert/strict';
import { getPaperclipDashboard, paperclipConfiguration } from './paperclip-bridge.js';

test('Paperclip configuration is disabled when credentials are missing', () => {
  assert.equal(paperclipConfiguration({}).configured, false);
});

test('dashboard bridge rejects an unmapped Enjaz workspace before network access', async () => {
  await assert.rejects(
    getPaperclipDashboard('workspace-a', {
      PAPERCLIP_API_URL: 'https://paperclip.example',
      PAPERCLIP_API_KEY: 'test-key',
      PAPERCLIP_WORKSPACE_COMPANY_MAP: '{}',
    }),
    error => error.status === 404,
  );
});

test('dashboard bridge sends only the mapped company request with server-side auth', async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json; charset=utf-8' },
      json: async () => ({ status: 'ok', agents: 3 }),
    };
  };
  try {
    const result = await getPaperclipDashboard('workspace-a', {
      PAPERCLIP_API_URL: 'https://paperclip.example/',
      PAPERCLIP_API_KEY: 'test-key',
      PAPERCLIP_WORKSPACE_COMPANY_MAP: JSON.stringify({ 'workspace-a': 'company-7' }),
    });
    assert.deepEqual(result, { status: 'ok', agents: 3 });
    assert.equal(captured.url, 'https://paperclip.example/api/companies/company-7/dashboard');
    assert.equal(captured.options.headers.Authorization, 'Bearer test-key');
    assert.equal(captured.options.redirect, 'error');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('dashboard bridge refuses plain HTTP outside localhost', async () => {
  await assert.rejects(
    getPaperclipDashboard('workspace-a', {
      PAPERCLIP_API_URL: 'http://paperclip.example',
      PAPERCLIP_API_KEY: 'test-key',
      PAPERCLIP_WORKSPACE_COMPANY_MAP: JSON.stringify({ 'workspace-a': 'company-7' }),
    }),
    error => error.status === 503,
  );
});
