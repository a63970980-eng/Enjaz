const MAX_STEPS=12;
const SAFE_INTENTS=new Set(['analyze','create_report','notify','lookup','request_approval']);

function allowedToolNames(availableTools){
 if(!Array.isArray(availableTools)) return null;
 return new Set(availableTools.map(tool=>typeof tool==='string'?tool:tool?.name).filter(Boolean));
}

export function validatePlan(plan,{availableTools=null}={}){
 if(!plan||typeof plan!=='object') throw new Error('Plan must be an object');
 if(typeof plan.goal!=='string'||plan.goal.trim().length<3||plan.goal.length>4000) throw new Error('Invalid plan goal');
 if(!Array.isArray(plan.steps)||plan.steps.length===0) throw new Error('Plan must contain at least one step');
 if(plan.steps.length>MAX_STEPS) throw new Error('Plan exceeds maximum step limit');
 const ids=new Set();
 const tools=allowedToolNames(availableTools);
 for(const step of plan.steps){
  if(!step||typeof step!=='object'||!step.id||ids.has(step.id)) throw new Error('Plan contains duplicate or missing step id');
  ids.add(step.id);
  if(!SAFE_INTENTS.has(step.intent)) throw new Error(`Unsupported planning intent: ${step.intent}`);
  if(typeof step.action!=='string'||!step.action.trim()) throw new Error(`Executable action is required: ${step.id}`);
  if(tools&&!tools.has(step.action)) throw new Error(`Plan action is not available to this employee: ${step.action}`);
  if(step.input!==undefined&&(step.input===null||typeof step.input!=='object'||Array.isArray(step.input))) throw new Error(`Invalid step input: ${step.id}`);
  const deps=step.dependsOn??step.depends_on??[];
  if(!Array.isArray(deps)||!deps.every(id=>typeof id==='string')) throw new Error(`Invalid step dependencies: ${step.id}`);
  if(deps.includes(step.id)||!deps.every(id=>ids.has(id))) throw new Error(`Step dependency must reference an earlier step: ${step.id}`);
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
