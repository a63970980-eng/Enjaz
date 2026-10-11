import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWorkflowSteps } from './workflow-engine.js';

test('normalizeWorkflowSteps assigns stable execution order and defaults', () => {
  const steps = normalizeWorkflowSteps([
    { id: 'collect', employeeId: 'employee-a', input: { source: 'crm' } },
    { id: 'report', employeeId: 'employee-b', action: 'report.create', depends_on: ['collect'] }
  ]);
  assert.equal(steps.length, 2);
  assert.equal(steps[0].order, 1);
  assert.equal(steps[0].action, 'data.analyze');
  assert.deepEqual(steps[0].depends_on, []);
  assert.equal(steps[1].order, 2);
  assert.deepEqual(steps[1].depends_on, ['collect']);
});

test('normalizeWorkflowSteps rejects missing or duplicate step IDs', () => {
  assert.throws(
    () => normalizeWorkflowSteps([
      { id: 'same', employeeId: 'employee-a' },
      { id: 'same', employeeId: 'employee-b' }
    ]),
    /Duplicate workflow step ID/
  );
});

test('normalizeWorkflowSteps rejects unknown and forward dependencies', () => {
  assert.throws(
    () => normalizeWorkflowSteps([{ id: 'step-a', employeeId: 'employee-a', depends_on: ['missing'] }]),
    /unknown dependency/
  );
  assert.throws(
    () => normalizeWorkflowSteps([
      { id: 'step-a', employeeId: 'employee-a', depends_on: ['step-b'] },
      { id: 'step-b', employeeId: 'employee-b' }
    ]),
    /must appear before/
  );
});

test('normalizeWorkflowSteps rejects malformed action, input and dependency lists', () => {
  assert.throws(() => normalizeWorkflowSteps([{ id: 'a', employeeId: 'e', action: '../shell' }]), /invalid action/);
  assert.throws(() => normalizeWorkflowSteps([{ id: 'a', employeeId: 'e', input: [] }]), /input must be an object/);
  assert.throws(() => normalizeWorkflowSteps([{ id: 'a', employeeId: 'e', depends_on: 'b' }]), /dependencies must be an array/);
  assert.throws(() => normalizeWorkflowSteps([{ id: 'a', employeeId: 'e', depends_on: ['a'] }]), /cannot depend on itself/);
});

test('normalizeWorkflowSteps rejects empty workflows and missing employee assignment', () => {
  assert.throws(() => normalizeWorkflowSteps([]), /at least one step/);
  assert.throws(() => normalizeWorkflowSteps([{ id: 'a' }]), /requires employeeId/);
});
