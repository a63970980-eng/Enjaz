import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyWebhook } from './webhook-gateway.js';

test('accepts a valid HMAC webhook',()=>{const secret='test-secret',timestamp=String(Math.floor(Date.now()/1000)),body='{"event":"invoice.created"}',signature=createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex');assert.doesNotThrow(()=>verifyWebhook({secret,timestamp,rawBody:body,signature}));});
test('rejects replayed/expired timestamps',()=>{const secret='test-secret',timestamp=String(Math.floor(Date.now()/1000)-301),body='{}',signature=createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex');assert.throws(()=>verifyWebhook({secret,timestamp,rawBody:body,signature}),/timestamp/);});
test('rejects invalid signatures',()=>{assert.throws(()=>verifyWebhook({secret:'secret',timestamp:String(Math.floor(Date.now()/1000)),rawBody:'{}',signature:'00'.repeat(32)}),/signature/);});
