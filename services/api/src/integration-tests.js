import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyWebhook } from './webhook-gateway.js';
import { enqueueWorkflowRun } from './queue-enqueue.js';

test('webhook signature contract',()=>{const secret='integration-test-secret';const timestamp=String(Math.floor(Date.now()/1000));const body=JSON.stringify({event:'invoice.created'});const signature=createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex');assert.doesNotThrow(()=>verifyWebhook({secret,timestamp,rawBody:body,signature}));assert.throws(()=>verifyWebhook({secret,timestamp,rawBody:body,signature:'sha256='+'00'.repeat(32)}));});

test('workflow enqueue contract',()=>{assert.equal(typeof enqueueWorkflowRun,'function');});
