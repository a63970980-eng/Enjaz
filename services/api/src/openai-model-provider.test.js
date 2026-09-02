import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOpenAIPlan } from './openai-model-provider.js';

const context={system:'plan safely',goal:'Analyze weekly sales',employee:{name:'Sales AI',role:'analyst',tools:['data.analyze']},memory:[],availableTools:[{name:'data.analyze',risk:'low'}]};

test('OpenAI planner sends structured output and parses the plan',async()=>{
 let request;
 const fetchImpl=async(url,options)=>{request={url,options};return {ok:true,status:200,json:async()=>({output_text:JSON.stringify({goal:'Analyze weekly sales',steps:[{id:'step-1',action:'data.analyze',input:{goal:'Analyze weekly sales'},approval_required:false,depends_on:[]}]})})};};
 const plan=await generateOpenAIPlan(context,{fetchImpl,apiKey:'test-key',model:'gpt-5.6-luna'});
 assert.equal(plan.steps[0].action,'data.analyze');
 assert.equal(request.url,'https://api.openai.com/v1/responses');
 const body=JSON.parse(request.options.body);
 assert.equal(body.model,'gpt-5.6-luna');
 assert.equal(body.store,false);
 assert.equal(body.text.format.type,'json_schema');
 assert.equal(body.text.format.strict,true);
 assert.equal(body.text.format.name,'enjaz_plan');
});

test('OpenAI planner fails clearly when API key is missing',async()=>assert.rejects(()=>generateOpenAIPlan(context,{fetchImpl:async()=>{throw new Error('should not call fetch')},apiKey:''}),/OPENAI_API_KEY/));

test('OpenAI planner surfaces provider errors',async()=>{const fetchImpl=async()=>({ok:false,status:401,json:async()=>({error:{message:'Invalid API key'}})});await assert.rejects(()=>generateOpenAIPlan(context,{fetchImpl,apiKey:'bad'}),/Invalid API key/);});

test('OpenAI planner rejects malformed model output',async()=>{const fetchImpl=async()=>({ok:true,status:200,json:async()=>({output_text:'not-json'})});await assert.rejects(()=>generateOpenAIPlan(context,{fetchImpl,apiKey:'test-key'}),/invalid plan payload/);});
