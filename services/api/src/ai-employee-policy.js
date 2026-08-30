const DEFAULT_LIMITS={maxToolExecutionsPerTask:10,maxInputBytes:65536,maxOutputBytes:262144,maxSteps:12};
const BLOCKED_ACTIONS=new Set(['shell.exec','code.exec','filesystem.write','network.raw','credential.read']);
export function validateEmployeePolicy(employee,{action,input}={}){
 if(!employee||employee.status!=='active')throw new Error('AI employee is not active');
 const limits={...DEFAULT_LIMITS,...(employee.policy||{})};
 if(BLOCKED_ACTIONS.has(action))throw new Error(`Tool blocked by platform policy: ${action}`);
 if(typeof action!=='string'||action.length>128)throw new Error('Invalid tool action');
 const bytes=Buffer.byteLength(JSON.stringify(input??{}),'utf8');
 if(bytes>Number(limits.maxInputBytes))throw new Error('Tool input exceeds employee policy limit');
 return {limits};
}
export function assertExecutionBudget(state={},limits=DEFAULT_LIMITS){
 const executions=Number(state.toolExecutions||0);
 if(executions>=Number(limits.maxToolExecutionsPerTask))throw new Error('AI employee tool execution limit exceeded');
 return executions+1;
}
export const employeePolicyDefaults=DEFAULT_LIMITS;
