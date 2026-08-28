export const builtinTools = [
  { name: 'crm.read', action: 'read', risk: 'low', requiresApproval: false },
  { name: 'crm.create_lead', action: 'create_lead', risk: 'medium', requiresApproval: false },
  { name: 'email.send', action: 'send_email', risk: 'medium', requiresApproval: false },
  { name: 'purchase.create', action: 'purchase', risk: 'high', requiresApproval: true },
  { name: 'finance.payment', action: 'payment', risk: 'critical', requiresApproval: true },
  { name: 'data.delete', action: 'delete_data', risk: 'critical', requiresApproval: true },
];

export function listToolsForEmployee(employee) {
  return builtinTools.filter((tool) => employee?.permissions?.includes(`tool:${tool.name}`));
}
