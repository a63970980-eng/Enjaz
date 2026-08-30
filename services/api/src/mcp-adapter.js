import { executeIntegration, listIntegrations } from './integration-registry.js';

export function getMcpTools(){return listIntegrations().flatMap(i=>i.actions.map(action=>({name:`integration.${i.name}.${action}`,description:`${i.description} Action: ${action}`,inputSchema:{type:'object'}})));}
export async function callMcpTool({name,config,input}){const match=/^integration\.([a-z0-9_-]+)\.([a-z0-9_-]+)$/i.exec(name);if(!match)throw new Error(`Invalid MCP tool name: ${name}`);return executeIntegration({name:match[1],action:match[2],config,input});}
