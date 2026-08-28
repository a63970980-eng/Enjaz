export type EmployeeStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TaskStatus = 'queued' | 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ToolDefinition { name: string; description: string; risk: RiskLevel; requiresApproval: boolean; }
export interface AIEmployee { id: string; workspaceId: string; name: string; role: string; goal: string; skills: string[]; tools: ToolDefinition[]; permissions: string[]; budgetCents: number; status: EmployeeStatus; }
export interface Task { id: string; workspaceId: string; employeeId: string; title: string; objective: string; status: TaskStatus; risk: RiskLevel; createdAt: string; }
export interface ExecutionStep { id: string; taskId: string; action: string; tool?: string; status: 'pending'|'running'|'completed'|'blocked'|'failed'; requiresApproval: boolean; }
export interface ApprovalRequest { id: string; taskId: string; action: string; reason: string; risk: RiskLevel; status: 'pending'|'approved'|'rejected'; }
