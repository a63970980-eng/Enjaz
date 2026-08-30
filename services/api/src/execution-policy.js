const TERMINAL_TASK_STATUSES=new Set(['completed','cancelled','failed']);
const HIGH_RISK_ACTIONS=new Set(['payment','delete_data','bulk_message','financial_change','purchase']);
export function isTerminalTaskStatus(status){return TERMINAL_TASK_STATUSES.has(status);}
export function requiresHumanApproval(action,toolRisk){return HIGH_RISK_ACTIONS.has(action)||toolRisk==='high';}
export function assertExecutableTask(task){if(!task)throw new Error('Task not found');if(isTerminalTaskStatus(task.status))throw new Error(`Task cannot be executed from status: ${task.status}`);}
export function assertAssignedTool(employee,action){if(!Array.isArray(employee?.tools)||!employee.tools.some(t=>typeof t==='string'?t===action:t?.name===action))throw new Error(`Tool not assigned to employee: ${action}`);}
export function approvalDecisionStatus(status){if(status==='approved')return 'approved';if(status==='rejected')return 'rejected';throw new Error('Invalid approval decision');}
