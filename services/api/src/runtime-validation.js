import { getTool, listTools } from './tool-registry.js';
import { validateEmployeePolicy } from './ai-employee-policy.js';

export function validateRuntimeConfiguration(employee){
 if(!employee) throw new Error('Employee is required');
 if(!Array.isArray(employee.tools)) throw new Error('Employee tools must be an array');
 for(const entry of employee.tools){const name=typeof entry==='string'?entry:entry?.name;if(!name||!getTool(name))throw new Error(`Employee references unknown tool: ${name}`);}
 const policy=validateEmployeePolicy(employee,{action:employee.tools[0]&&typeof employee.tools[0]==='string'?employee.tools[0]:employee.tools[0]?.name,input:{}});
 return {valid:true,toolCount:employee.tools.length,registeredTools:listTools().length,limits:policy.limits};
}
