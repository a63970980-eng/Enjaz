export type EmployeeStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TaskStatus = 'queued' | 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface AIEmployee {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  goal?: string;
  skills: string[];
  tools: string[];
  permissions: string[];
  model: string;
  budgetCents: number;
  schedule: Record<string, unknown>;
  status: EmployeeStatus;
}

export interface Task {
  id: string;
  workspaceId: string;
  employeeId?: string;
  title: string;
  objective: string;
  status: TaskStatus;
  priority: number;
}

export interface ApprovalPolicy {
  action: string;
  required: boolean;
  maxValueCents?: number;
}
