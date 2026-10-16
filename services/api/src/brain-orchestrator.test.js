import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toPlanMemoryInput } from './brain-orchestrator.js';

const migrationPath = new URL('../db/migrations/005_ai_employee_memory.sql', import.meta.url);

test('plan memory maps to the persisted employee-memory schema', async () => {
  const migration = await readFile(migrationPath, 'utf8');
  const input = toPlanMemoryInput({
    workspaceId: 'workspace-1',
    employeeId: 'employee-1',
    taskId: 'task-1',
    plan: { goal: 'Prepare a report', steps: [{ id: 'step-1' }] },
  });

  assert.match(migration, /memory_type text not null check \(memory_type in \([^)]*'summary'/);
  assert.match(migration, /key text not null/);
  assert.match(migration, /source_task_id uuid/);
  assert.deepEqual(input, {
    workspaceId: 'workspace-1',
    employeeId: 'employee-1',
    type: 'summary',
    key: 'task-plan:task-1',
    content: JSON.stringify({ goal: 'Prepare a report', steps: [{ id: 'step-1' }] }),
    importance: 3,
    sourceTaskId: 'task-1',
  });
  assert.equal('metadata' in input, false);
});
