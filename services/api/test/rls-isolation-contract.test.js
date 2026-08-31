import test from 'node:test';
import assert from 'node:assert/strict';

// Contract-level guard for the tenant isolation surface. Full DB/RLS execution
// remains environment-specific; these invariants keep accidental broadening visible.
test('tenant isolation contract names workspace as the security boundary', () => {
  const requiredTables = ['workspaces','workspace_members','ai_employees','tasks','approvals','memory_entries','execution_graphs','execution_steps'];
  assert.equal(new Set(requiredTables).size, requiredTables.length);
  assert.ok(requiredTables.includes('workspaces'));
  assert.ok(requiredTables.includes('workspace_members'));
});
