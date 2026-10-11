import test from 'node:test';
import assert from 'node:assert/strict';
import { searchRepositories, analyzeRepository } from './repository-intelligence.js';

function response(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

test('searchRepositories validates short queries', async () => {
  await assert.rejects(() => searchRepositories({ query: ' ' }), { status: 400 });
});

test('searchRepositories returns a bounded, normalized result list', async () => {
  let requestedUrl = '';
  const fetchImpl = async (url) => {
    requestedUrl = String(url);
    return response(200, { total_count: 1, items: [{
      full_name: 'example/agent', description: 'Agent tools', html_url: 'https://github.com/example/agent',
      stargazers_count: 12, language: 'JavaScript', license: { spdx_id: 'MIT' }, archived: false,
      updated_at: '2026-01-01T00:00:00Z', default_branch: 'main',
    }] });
  };
  const result = await searchRepositories({ query: 'agent tools', language: 'JavaScript', limit: 99, fetchImpl });
  assert.match(requestedUrl, /per_page=20/);
  assert.equal(result.items[0].fullName, 'example/agent');
  assert.equal(result.items[0].license, 'MIT');
});

test('analyzeRepository validates repository identifiers', async () => {
  await assert.rejects(() => analyzeRepository({ fullName: 'https://github.com/example/repo' }), { status: 400 });
});

test('analyzeRepository returns a bounded structured assessment', async () => {
  const fetchImpl = async (url) => {
    if (String(url).endsWith('/readme')) return response(200, { encoding: 'base64', content: Buffer.from('# Agent\nA useful toolkit').toString('base64') });
    return response(200, {
      full_name: 'example/agent', description: 'Agent tools', html_url: 'https://github.com/example/agent',
      stargazers_count: 10, language: 'JavaScript', license: { spdx_id: 'MIT', url: 'https://api.github.com/licenses/mit' },
      archived: false, updated_at: '2026-01-01T00:00:00Z', default_branch: 'main',
    });
  };
  const generate = async () => ({ text: JSON.stringify({
    summary: 'Reusable tooling', relevanceScore: 120, licenseRisk: 'low', compatibility: 'Fits Node ESM',
    securityConcerns: [], opportunities: [{ title: 'Add test pattern', value: 'Improve reliability', effort: 'low', rationale: 'Simple' }],
    recommendation: 'adapt', nextSteps: ['Review code'],
  }) });
  const result = await analyzeRepository({ fullName: 'example/agent', fetchImpl, generate });
  assert.equal(result.analysis.relevanceScore, 100);
  assert.equal(result.analysis.recommendation, 'adapt');
  assert.equal(result.repository.license, 'MIT');
});
