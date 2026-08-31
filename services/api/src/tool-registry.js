const tools=new Map();
const HIGH_RISK_ACTIONS=new Set(['payment','delete_data','bulk_message','financial_change','purchase']);
export function registerTool(tool){if(!tool?.name||typeof tool.execute!=='function')throw new Error('Invalid tool');tools.set(tool.name,tool);}
export function getTool(name){return tools.get(name);}
export function listTools(){return [...tools.values()].map(({name,description,risk})=>({name,description,risk}));}
export function isToolAllowed(employee,name){return Array.isArray(employee.tools)&&employee.tools.some(t=>typeof t==='string'?t===name:t?.name===name);}
export function needsApproval(name){return HIGH_RISK_ACTIONS.has(name)||getTool(name)?.risk==='high';}
export async function executeTool({employee,name,input,context={},approved=false}){const tool=getTool(name);if(!tool)throw new Error(`Unknown tool: ${name}`);if(!isToolAllowed(employee,name))throw new Error(`Tool not allowed for employee: ${name}`);if(needsApproval(name)&&!approved)throw new Error(`Human approval required for high-risk tool: ${name}`);return tool.execute({employee,input,context,approved});}
registerTool({name:'data.analyze',description:'Analyze structured business data without external side effects.',risk:'low',execute:async({input,context})=>({type:'analysis',input,context,summary:'Structured analysis completed by the ENJAZ tool runtime.'})});
registerTool({name:'report.create',description:'Create an in-memory report result.',risk:'low',execute:async({input,context})=>({type:'report',title:input?.title||'ENJAZ Report',content:input?.content||'',context})});
