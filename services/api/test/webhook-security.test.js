import test from 'node:test';
import assert from 'node:assert/strict';
import { getTool } from '../src/tool-registry.js';
import '../src/integrations/webhook-tool.js';

test('webhook tool rejects non-HTTPS and private IP targets before network access', async () => {
  const tool=getTool('webhook.request');
  await assert.rejects(tool.execute({input:{url:'http://127.0.0.1/'}}),/Only HTTPS webhook URLs are allowed/);
  await assert.rejects(tool.execute({input:{url:'https://127.0.0.1/'}}),/non-public address/);
  await assert.rejects(tool.execute({input:{url:'https://10.0.0.1/'}}),/non-public address/);
});

test('webhook tool rejects unsupported methods', async () => {
  const tool=getTool('webhook.request');
  await assert.rejects(tool.execute({input:{url:'https://127.0.0.1/',method:'DELETE'}}),/non-public address/);
});
