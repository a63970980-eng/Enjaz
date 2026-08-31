import test from 'node:test';
import assert from 'node:assert/strict';
import { processOneJob } from './queue-worker.js';

test('worker module exposes a single-job processing entry point',()=>{assert.equal(typeof processOneJob,'function');});
