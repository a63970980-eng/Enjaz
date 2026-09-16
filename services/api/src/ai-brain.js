import { getTool, listTools } from './tool-registry.js';

const SYSTEM='You are an ENJAZ AI employee planner. Return only valid JSON. Break the goal into safe, concrete steps. Never invent tools. Mark steps requiring external side effects or sensitive actions as approval_required.';
const MAX_STEPS=12;
const SAFE_INTENTS=new Set(['analyze','create_report','notify','lookup','request_approval']);

export function buildBrainContext({employee,goal,memory=[],workspaceId='',taskId='',employeeId=''}){return {system:SYSTEM,workspaceId,taskId,employeeId,employee:{name:employee.name,role:employee.role,goal:employee.goal,skills:employee.skills||[],permissions:employee.permissions||[],tools:employee.tools||[]},goal,memory:memory.slice(-20),availableTools:listTools()};}

export function validatePlan(plan,employee){
 if(!plan||!Array.isArray(plan.steps)||plan.steps.length<1||plan.steps.length>MAX_STEPS)throw new Error(`Invalid AI plan: steps must contain 1-${MAX_STEPS} items`);
 const allowed=new Set((employee.tools||[]).map(t=>typeof t==='string'?t:t?.name));
 const ids=new Set();
 return {...plan,steps:plan.steps.map((step,i)=>{
  const id=String(step?.id||`step-${i+1}`).trim();
  if(!id||ids.has(id))throw new Error(`AI plan contains duplicate or missing step id at step ${i+1}`);
  ids.add(id);
  if(!step?.action||!allowed.has(step.action)||!getTool(step.action))throw new Error(`Plan step ${i+1} uses an unavailable tool: ${step?.action||'unknown'}`);
  const intent=String(step.intent||'analyze').trim();
  if(!SAFE_INTENTS.has(intent))throw new Error(`Plan step ${i+1} uses an unsupported intent: ${intent}`);
  const dependsOn=Array.isArray(step.dependsOn)?step.dependsOn:Array.isArray(step.depends_on)?step.depends_on:[];
  if(!dependsOn.every(id=>typeof id==='string')||dependsOn.includes(id)||!dependsOn.every(dep=>ids.has(dep)))throw new Error(`Plan step ${i+1} has invalid dependency references`);
  return {id,intent,action:step.action,input:step.input&&typeof step.input==='object'&&!Array.isArray(step.input)?step.input:{},approval_required:Boolean(step.approval_required??step.approvalRequired??getTool(step.action)?.risk==='high'),dependsOn};
 })};
}

export function createDeterministicPlan({employee,goal}){const tools=(employee.tools||[]).map(t=>typeof t==='string'?t:t?.name).filter(Boolean);const action=tools.includes('data.analyze')?'data.analyze':tools.includes('report.create')?'report.create':null;if(!action)throw new Error('No suitable assigned tool is available for planning');return {goal,steps:[{id:'step-1',intent:action==='report.create'?'create_report':'analyze',action,input:{goal},approval_required:getTool(action)?.risk==='high',dependsOn:[]}]};}
