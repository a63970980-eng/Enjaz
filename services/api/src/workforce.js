import { randomUUID } from 'node:crypto';

const employees = new Map();
const tasks = new Map();
const audit = [];

export function createEmployee(input) {
  const employee = { id: randomUUID(), status: 'active', skills: [], tools: [], permissions: [], budgetCents: 0, ...input };
  employees.set(employee.id, employee);
  audit.push({ id: randomUUID(), type: 'employee.created', employeeId: employee.id, at: new Date().toISOString() });
  return employee;
}

export function listEmployees(workspaceId) { return [...employees.values()].filter(e => e.workspaceId === workspaceId); }
export function createTask(input) {
  const task = { id: randomUUID(), status: 'queued', createdAt: new Date().toISOString(), ...input };
  tasks.set(task.id, task);
  audit.push({ id: randomUUID(), type: 'task.created', taskId: task.id, at: task.createdAt });
  return task;
}
export function listTasks(workspaceId) { return [...tasks.values()].filter(t => t.workspaceId === workspaceId); }
export function listAudit(workspaceId) {
  const ids = new Set([...employees.values()].filter(e => e.workspaceId === workspaceId).map(e => e.id));
  return audit.filter(a => !a.employeeId || ids.has(a.employeeId));
}
