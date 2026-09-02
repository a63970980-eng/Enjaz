const providers=new Map();
export function registerModelProvider(name,provider){if(!name||typeof provider?.generate!=='function')throw new Error('Invalid model provider');providers.set(name,provider);}
export function getModelProvider(name){return providers.get(name)||providers.get('deterministic');}
export async function generatePlan({provider='deterministic',context}){const p=getModelProvider(provider);if(!p)throw new Error('No model provider configured');return p.generate(context);}
registerModelProvider('deterministic',{generate:async(context)=>({goal:context.goal,steps:[]})});
import './openai-model-provider.js';
