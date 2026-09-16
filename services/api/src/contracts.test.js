import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentTaskSchema, ToolCallSchema, parseContract } from './contracts.js';

test('tool call contract normalizes optional fields', () => {
  const value = parseContract(ToolCallSchema, { tool: 'data.analyze' }, 'tool call');
  assert.equal(value.tool, 'data.analyze');
  assert.deepEqual(value.input, {});
  assert.equal(value.approved, false);
});

test('agent task contract requires a goal', () => {
  assert.throws(() => parseContract(AgentTaskSchema, {
    workspaceId: 'w', taskId: 't', employeeId: 'e'
  }, 'agent task'), (error) => error.code === 'CONTRACT_VALIDATION_FAILED');
});

test('tool call rejects malformed tool names', () => {
  assert.throws(() => parseContract(ToolCallSchema, { tool: '' }, 'tool call'), /validation failed/);
});
