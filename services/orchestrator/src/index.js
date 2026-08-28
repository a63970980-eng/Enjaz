const sensitiveActions = new Set(['payment','delete_data','bulk_message','financial_change','credential_change','purchase']);

export function createPlan(objective) {
  return { objective, steps: [{ type: 'analyze', description: 'Analyze objective and required context' }, { type: 'execute', description: 'Execute approved tool actions' }, { type: 'report', description: 'Produce a verifiable result' }] };
}

export function requiresApproval(action) {
  return sensitiveActions.has(action);
}

export function createExecutionContext({ workspaceId, employeeId, taskId }) {
  return { workspaceId, employeeId, taskId, createdAt: new Date().toISOString(), approvedActions: [] };
}

if (process.argv[1]?.endsWith('index.js')) console.log('ENJAZ Orchestrator ready');
