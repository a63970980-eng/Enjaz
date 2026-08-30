import { registerModelProvider } from './model-provider.js';

const ENDPOINT='https://api.openai.com/v1/responses';
function extractText(data){return (data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');}
registerModelProvider('openai',{generate:async(context)=>{
 const key=process.env.OPENAI_API_KEY;if(!key)throw new Error('OPENAI_API_KEY is not configured');
 const model=context.employee?.model&&context.employee.model!=='default'?context.employee.model:(process.env.OPENAI_MODEL||'gpt-5-mini');
 const response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model,input:[{role:'system',content:[{type:'input_text',text:context.system}]},{role:'user',content:[{type:'input_text',text:JSON.stringify(context)}]}],text:{format:{type:'json_object'}}})});
 if(!response.ok)throw new Error(`OpenAI request failed: ${response.status}`);const data=await response.json();const text=extractText(data);if(!text)throw new Error('OpenAI returned no plan');return JSON.parse(text);
}});
