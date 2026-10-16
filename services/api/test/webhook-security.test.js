import test from 'node:test';
import assert from 'node:assert/strict';
import { getTool } from '../src/tool-registry.js';
import { unsafeAddress } from '../src/integrations/webhook-tool.js';

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

test('webhook address validation rejects reserved IPv4 and mapped/private IPv6 addresses', () => {
  for (const address of ['100.64.0.1', '198.18.0.1', '192.0.2.1', '203.0.113.9', '::ffff:127.0.0.1', '0:0:0:0:0:ffff:7f00:1', 'fec0::1', '2001:db8::1']) {
    assert.equal(unsafeAddress(address), true, address);
  }
});
