import test from 'node:test';
import assert from 'node:assert/strict';
import { runStarted, textMessageContent, toolCallStart, validateAgentEvent } from './src/ag-ui.js';

test('AG-UI run lifecycle events are validated', () => {
  assert.equal(runStarted('run-1', 'thread-1').type, 'RUN_STARTED');
  assert.equal(textMessageContent('message-1', 'مرحبا').type, 'TEXT_MESSAGE_CONTENT');
  assert.equal(toolCallStart('tool-1', 'data.analyze').type, 'TOOL_CALL_START');
});

test('AG-UI validation rejects malformed events', () => {
  assert.throws(() => validateAgentEvent({ type: 'TEXT_MESSAGE_CONTENT' }));
});
