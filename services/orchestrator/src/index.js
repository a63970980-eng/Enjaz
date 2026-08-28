const sensitiveActions = new Set(['payment','delete_data','bulk_message','financial_change','credential_change','purchase']);

export function createPlan(objective, tools = []) {
  const selectedTools = tools.filter((tool) => objective.toLowerCase().includes(tool.name.toLowerCase()));
  return {
    objective,
    steps: [
      { type: 'analyze', description: 'Analyze objective and required context' },
      { type: 'select_tools', tools: selectedTools.map((t) => t.name) },
      { type: 'execute', description: 'Execute only permitted tool actions' },
      { type: 'report', description: 'Produce a verifiable result' },
    ],
  };
}

export function requiresApproval(action) {
  return sensitiveActions.has(action);
}

export function authorizeTool({ tool, employee }) {
  if (!employee?.permissions?.includes(`tool:${tool.name}`)) {
    return { allowed: false, reason: 'Tool permission not granted' };
  }
  if (tool.requiresApproval || requiresApproval(tool.action || tool.name)) {
    return { allowed: false, requiresApproval: true, reason: 'Human approval required' };
  }
  return { allowed: true };
}

export function createExecutionContext({ workspaceId, employeeId, taskId }) {
  return { workspaceId, employeeId, taskId, createdAt: new Date().toISOString(), approvedActions: [], consumedBudgetCents: 0 };
}

export function requestApproval({ taskId, action, reason }) {
  return { id: crypto.randomUUID(), taskId, action, reason, status: 'pending', createdAt: new Date().toISOString() };
}

if (process.argv[1]?.endsWith('index.js')) console.log('ENJAZ Agent Runtime ready');
