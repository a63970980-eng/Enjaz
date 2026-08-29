const HIGH_RISK = new Set(['payment','delete_data','bulk_message','financial_change','credential_change','purchase']);

export function inspectToolCall(call, employee) {
  const allowed = employee.tools?.some(t => t.name === call.tool);
  if (!allowed) return { allowed:false, blocked:true, reason:'Tool is not granted to this employee.' };
  const needsApproval = HIGH_RISK.has(call.action) || employee.tools.find(t=>t.name===call.tool)?.requiresApproval;
  return { allowed:true, blocked:Boolean(needsApproval), requiresApproval:Boolean(needsApproval), reason:needsApproval?'Human approval is required for this action.':undefined };
}

export function runStep(step, employee) {
  const decision=inspectToolCall(step,employee);
  if(decision.blocked) return {...step,status:'blocked',decision};
  return {...step,status:'completed',decision};
}

export function executePlan(plan,employee){return plan.steps.map((step,index)=>runStep({...step,id:`step_${index+1}`},employee));}
