import test from 'node:test';
import assert from 'node:assert/strict';
import { installGracefulShutdown } from './queue-worker.js';

test('worker shutdown handler is reversible',()=>{const controller=new AbortController();const cleanup=installGracefulShutdown({controller});cleanup();assert.equal(controller.signal.aborted,false);});
