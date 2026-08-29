import { randomUUID } from 'node:crypto';

const employees = new Map();
const tasks = new Map();
const approvals = new Map();
const audit = [];

const record = event => audit.push({ id: randomUUID(), at: new Date().toISOString(), ...event });

export function createEmployee(input) {
  const employee = { id: randomUUID(), status: 'active', skills: [], tools: [], permissions: [], budgetCents: 0, ...input };
  employees.set(employee.id, employee);
  record({ type:'employee.created', workspaceId:employee.workspaceId, employeeId:employee.id });
  return employee;
}
export function listEmployees(workspaceId) { return [...employees.values()].filter(e => e.workspaceId === workspaceId); }
export function createTask(input) {
  if (!input.employeeId || !employees.has(input.employeeId)) throw new Error('employeeId is required and must reference an existing employee');
  const employee=employees.get(input.employeeId);
  if(employee.workspaceId!==input.workspaceId) throw new Error('Employee does not belong to this workspace');
  const task={id:randomUUID(),status:'queued',createdAt:new Date().toISOString(),...input};
  tasks.set(task.id,task); record({type:'task.created',workspaceId:task.workspaceId,taskId:task.id,employeeId:task.employeeId}); return task;
}
export function listTasks(workspaceId) { return [...tasks.values()].filter(t=>t.workspaceId===workspaceId); }
export function createApproval(input) { const a={id:randomUUID(),status:'pending',createdAt:new Date().toISOString(),...input}; approvals.set(a.id,a); record({type:'approval.created',workspaceId:a.workspaceId,taskId:a.taskId,approvalId:a.id}); return a; }
export function decideApproval(id,workspaceId,status) { const a=approvals.get(id); if(!a||a.workspaceId!==workspaceId) throw new Error('Approval not found'); if(!['approved','rejected'].includes(status)) throw new Error('Invalid approval status'); a.status=status; a.decidedAt=new Date().toISOString(); record({type:`approval.${status}`,workspaceId,taskId:a.taskId,approvalId:id}); return a; }
export function listApprovals(workspaceId) { return [...approvals.values()].filter(a=>a.workspaceId===workspaceId); }
export function listAudit(workspaceId) { return audit.filter(a=>a.workspaceId===workspaceId); }
