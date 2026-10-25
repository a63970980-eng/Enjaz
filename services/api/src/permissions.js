export const PERMISSIONS = Object.freeze({
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_MANAGE: 'workspace.manage',
  WORKSPACE_OPERATIONS_READ: 'workspace.operations.read',
  WORKFORCE_READ: 'workforce.read',
  WORKFORCE_MANAGE: 'workforce.manage',
  EMPLOYEES_READ: 'employees.read',
  EMPLOYEES_MANAGE: 'employees.manage',
  TEAMS_READ: 'teams.read',
  TEAMS_MANAGE: 'teams.manage',
  TASKS_READ: 'tasks.read',
  TASKS_MANAGE: 'tasks.manage',
  APPROVALS_READ: 'approvals.read',
  APPROVALS_DECIDE: 'approvals.decide',
  AUTOMATIONS_READ: 'automations.read',
  AUTOMATIONS_MANAGE: 'automations.manage',
  ANALYTICS_READ: 'analytics.read',
  BILLING_READ: 'billing.read',
  BILLING_MANAGE: 'billing.manage',
  AUDIT_READ: 'audit.read',
  INTEGRATIONS_READ: 'integrations.read',
  INTEGRATIONS_MANAGE: 'integrations.manage',
  MEMBERS_READ: 'members.read',
  MEMBERS_INVITE: 'members.invite',
  MEMBERS_MANAGE: 'members.manage',
  ORGANIZATION_MANAGE: 'organization.manage',
  SSO_CONFIGURE: 'sso.configure',
  DIRECTORY_MANAGE: 'directory.manage',
});

const knownPermissions = new Set(Object.values(PERMISSIONS));
const readPermissions = [
  PERMISSIONS.WORKSPACE_READ,
  PERMISSIONS.WORKFORCE_READ,
  PERMISSIONS.EMPLOYEES_READ,
  PERMISSIONS.TEAMS_READ,
  PERMISSIONS.TASKS_READ,
  PERMISSIONS.APPROVALS_READ,
  PERMISSIONS.AUTOMATIONS_READ,
  PERMISSIONS.ANALYTICS_READ,
  PERMISSIONS.BILLING_READ,
  PERMISSIONS.AUDIT_READ,
  PERMISSIONS.INTEGRATIONS_READ,
  PERMISSIONS.MEMBERS_READ,
];
const workspaceManagerPermissions = [
  ...readPermissions,
  PERMISSIONS.WORKSPACE_OPERATIONS_READ,
  PERMISSIONS.WORKSPACE_MANAGE,
  PERMISSIONS.WORKFORCE_MANAGE,
  PERMISSIONS.EMPLOYEES_MANAGE,
  PERMISSIONS.TEAMS_MANAGE,
  PERMISSIONS.TASKS_MANAGE,
  PERMISSIONS.APPROVALS_DECIDE,
  PERMISSIONS.AUTOMATIONS_MANAGE,
  PERMISSIONS.INTEGRATIONS_MANAGE,
  PERMISSIONS.MEMBERS_INVITE,
  PERMISSIONS.MEMBERS_MANAGE,
];
const organizationAdminPermissions = [
  ...workspaceManagerPermissions,
  PERMISSIONS.BILLING_MANAGE,
  PERMISSIONS.ORGANIZATION_MANAGE,
  PERMISSIONS.SSO_CONFIGURE,
  PERMISSIONS.DIRECTORY_MANAGE,
];
const rolePermissions = new Map([
  ['viewer', new Set(readPermissions)],
  // Member task-writing is intentionally not granted until its policy is approved.
  ['member', new Set(readPermissions)],
  ['manager', new Set(workspaceManagerPermissions)],
  ['admin', new Set(organizationAdminPermissions)],
  ['owner', new Set(organizationAdminPermissions)],
]);

export function hasPermission(userOrRole, permission) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  if (!knownPermissions.has(permission)) return false;
  return rolePermissions.get(role)?.has(permission) || false;
}

export function requirePermission(user, permission) {
  if (!user || !hasPermission(user, permission)) {
    throw Object.assign(new Error(`Permission required: ${permission}`), {
      status: 403,
      code: 'PERMISSION_REQUIRED',
      permission,
    });
  }
  return user;
}

export function permissionsForRole(role) {
  return [...(rolePermissions.get(role) || [])];
}
