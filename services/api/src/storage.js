// In-memory repository for local development. Replace with PostgreSQL adapter in production.
export class Repository {
  constructor(){ this.employees=new Map(); this.tasks=new Map(); this.approvals=new Map(); this.audit=[]; }
  addEmployee(e){this.employees.set(e.id,e);return e}
  employeesByWorkspace(id){return [...this.employees.values()].filter(x=>x.workspaceId===id)}
  addTask(t){this.tasks.set(t.id,t);return t}
  tasksByWorkspace(id){return [...this.tasks.values()].filter(x=>x.workspaceId===id)}
  addApproval(a){this.approvals.set(a.id,a);return a}
  approvalsByWorkspace(id){const ids=new Set(this.tasksByWorkspace(id).map(t=>t.id));return [...this.approvals.values()].filter(a=>ids.has(a.taskId))}
  log(event){this.audit.push(event);return event}
  auditByWorkspace(id){const employeeIds=new Set(this.employeesByWorkspace(id).map(e=>e.id));const taskIds=new Set(this.tasksByWorkspace(id).map(t=>t.id));return this.audit.filter(a=>(a.employeeId&&employeeIds.has(a.employeeId))||(a.taskId&&taskIds.has(a.taskId)))}
}
export const repository = new Repository();
