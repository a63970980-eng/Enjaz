const MAX_STEPS=12;
const SAFE_INTENTS=new Set(['analyze','create_report','notify','lookup','request_approval']);

export function validatePlan(plan){
 if(!plan||!Array.isArray(plan.steps)||plan.steps.length===0) throw new Error('Plan must contain at least one step');
 if(plan.steps.length>MAX_STEPS) throw new Error('Plan exceeds maximum step limit');
 const ids=new Set();
 for(const step of plan.steps){
  if(!step.id||ids.has(step.id)) throw new Error('Plan contains duplicate or missing step id');
  ids.add(step.id);
  if(!SAFE_INTENTS.has(step.intent)) throw new Error(`Unsupported planning intent: ${step.intent}`);
  if(step.dependsOn&&!step.dependsOn.every(id=>ids.has(id))) throw new Error(`Step dependency must reference an earlier step: ${step.id}`);
 }
 return plan;
}

export function createPlan({goal,steps}){
 if(typeof goal!=='string'||goal.trim().length<3||goal.length>4000) throw new Error('Invalid employee goal');
 return validatePlan({goal:goal.trim(),version:1,steps:steps.map((step,index)=>({id:step.id||`step_${index+1}`,intent:step.intent,action:step.action||null,input:step.input||{},dependsOn:step.dependsOn||[],requiresApproval:Boolean(step.requiresApproval)}))});
}

export function nextRunnableSteps(plan,completedIds=new Set()){
 validatePlan(plan);
 return plan.steps.filter(step=>!completedIds.has(step.id)&&(step.dependsOn||[]).every(id=>completedIds.has(id)));
}
