import { registerModelProvider } from './model-provider.js';

const endpoint='https://api.openai.com/v1/responses';
const schema={type:'object',additionalProperties:false,properties:{goal:{type:'string'},steps:{type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,properties:{id:{type:'string'},intent:{type:'string'},action:{type:'string'},input:{type:'object'},approval_required:{type:'boolean'},depends_on:{type:'array',items:{type:'string'}}},required:['id','intent','action','input','approval_required','depends_on']}}},required:['goal','steps']};

function extractText(response){if(typeof response?.output_text==='string')return response.output_text;for(const item of response?.output||[]){for(const part of item?.content||[]){if(typeof part?.text==='string')return part.text;}}return ''}

export async function generateOpenAIPlan(context,{fetchImpl=globalThis.fetch,apiKey=process.env.OPENAI_API_KEY,model=process.env.OPENAI_MODEL||'gpt-5.6-luna'}={}){
 if(!apiKey)throw new Error('OPENAI_API_KEY is not configured');
 if(typeof fetchImpl!=='function')throw new Error('Fetch implementation is unavailable');
 const response=await fetchImpl(endpoint,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,input:[{role:'developer',content:context.system},{role:'user',content:JSON.stringify(context)}],text:{format:{type:'json_schema',name:'enjaz_plan',strict:true,schema}},store:false})});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(payload?.error?.message||`OpenAI request failed (${response.status})`);
 const text=extractText(payload);if(!text)throw new Error('OpenAI returned no plan');
 try{return JSON.parse(text);}catch{throw new Error('OpenAI returned an invalid plan payload');}
}

registerModelProvider('openai',{generate:context=>generateOpenAIPlan(context)});
