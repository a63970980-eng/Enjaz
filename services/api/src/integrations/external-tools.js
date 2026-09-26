import { registerTool } from '../tool-registry.js';
import { getConnectionCredentials, logIntegrationAction } from '../credentials-vault.js';

const text=v=>String(v??'').trim();
const safeUrl=(raw,allowedHosts)=>{
 let u;try{u=new URL(raw)}catch{throw new Error('Invalid integration endpoint')};
 if(u.protocol!=='https:'||u.username||u.password)throw new Error('Integration endpoint must be HTTPS without embedded credentials');
 if(!allowedHosts.some(h=>h.startsWith('*.')?u.hostname.endsWith(h.slice(1)):u.hostname===h||u.hostname.endsWith('.'+h)))throw new Error('Integration endpoint host is not allowed');
 return u;
};
async function request(url,{method='GET',headers={},body,timeout=10000}={}){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
 try{const r=await fetch(url,{method,headers,body,redirect:'error',signal:c.signal});const raw=await r.text();let data=raw;try{data=raw?JSON.parse(raw):{}}catch{}return {ok:r.ok,status:r.status,data};}
 catch(e){if(e?.name==='AbortError')throw new Error('External integration timed out');throw e}finally{clearTimeout(t)}
}
async function run({input,context,provider,action,handler,risk}){
 const connectionId=text(input?.connectionId);if(!connectionId)throw new Error('connectionId is required');
 const c=await getConnectionCredentials({workspaceId:context.workspaceId,connectionId,provider});const started=Date.now();
 try{const result=await handler(c.credentials,input);await logIntegrationAction({workspaceId:context.workspaceId,taskId:context.taskId,employeeId:context.employeeId,connectionId:c.id,provider,action,status:'succeeded',requestMeta:{risk},responseMeta:{status:result.status??200,latencyMs:Date.now()-started}});return {type:'integration_action',provider,action,connectionId:c.id,result};}
 catch(error){await logIntegrationAction({workspaceId:context.workspaceId,taskId:context.taskId,employeeId:context.employeeId,connectionId:c.id,provider,action,status:'failed',requestMeta:{risk},responseMeta:{error:String(error?.message||error),latencyMs:Date.now()-started}});throw error;}
}
registerTool({name:'slack.message',description:'Send a message to a connected Slack incoming webhook.',risk:'high',execute:({input,context})=>run({input,context,provider:'slack',action:'message',risk:'high',handler:async(creds,input)=>{const u=safeUrl(creds.webhookUrl||input.webhookUrl,['hooks.slack.com']);const r=await request(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:text(input.text||input.message)})});if(!r.ok)throw new Error('Slack rejected the message');return {status:r.status};}})});
registerTool({name:'teams.message',description:'Send a message to a connected Microsoft Teams webhook.',risk:'high',execute:({input,context})=>run({input,context,provider:'microsoft_teams',action:'message',risk:'high',handler:async(creds,input)=>{const u=safeUrl(creds.webhookUrl||input.webhookUrl,['webhook.office.com']);const r=await request(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:text(input.text||input.message)})});if(!r.ok)throw new Error('Microsoft Teams rejected the message');return {status:r.status};}})});
registerTool({name:'discord.message',description:'Send a message to a connected Discord webhook.',risk:'high',execute:({input,context})=>run({input,context,provider:'discord',action:'message',risk:'high',handler:async(creds,input)=>{const u=safeUrl(creds.webhookUrl||input.webhookUrl,['discord.com','discordapp.com']);const r=await request(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:text(input.text||input.message)})});if(!r.ok)throw new Error('Discord rejected the message');return {status:r.status};}})});
registerTool({name:'n8n.webhook',description:'Trigger a connected n8n workflow webhook.',risk:'high',execute:({input,context})=>run({input,context,provider:'n8n',action:'webhook',risk:'high',handler:async(creds,input)=>{const u=safeUrl(creds.webhookUrl||input.webhookUrl,['n8n.cloud']);const r=await request(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input.payload||{})});if(!r.ok)throw new Error('n8n webhook rejected the request');return {status:r.status,data:r.data};}})});
registerTool({name:'hubspot.contacts.search',description:'Search contacts in a connected HubSpot account.',risk:'low',execute:({input,context})=>run({input,context,provider:'hubspot',action:'contacts.search',risk:'low',handler:async(creds,input)=>{const key=text(creds.accessToken||creds.apiKey);if(!key)throw new Error('HubSpot access token is missing');const r=await request('https://api.hubapi.com/crm/v3/objects/contacts/search',{method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({filterGroups:[{filters:[{propertyName:text(input.property||'email'),operator:'CONTAINS_TOKEN',value:text(input.query)}]}],properties:['email','firstname','lastname','phone'],limit:Math.min(100,Math.max(1,Number(input.limit)||20))})});if(!r.ok)throw new Error('HubSpot request failed');return {status:r.status,data:r.data};}})});
registerTool({name:'stripe.customers.list',description:'Read customers from a connected Stripe account.',risk:'low',execute:({input,context})=>run({input,context,provider:'stripe',action:'customers.list',risk:'low',handler:async(creds,input)=>{const key=text(creds.secretKey||creds.apiKey);if(!key)throw new Error('Stripe secret key is missing');const u=new URL('https://api.stripe.com/v1/customers');u.searchParams.set('limit',String(Math.min(100,Math.max(1,Number(input.limit)||20))));const r=await request(u,{headers:{Authorization:'Basic '+Buffer.from(key+':').toString('base64')}});if(!r.ok)throw new Error('Stripe request failed');return {status:r.status,data:r.data};}})});
registerTool({name:'github.issues.create',description:'Create an issue in a connected GitHub repository.',risk:'high',execute:({input,context})=>run({input,context,provider:'github',action:'issues.create',risk:'high',handler:async(creds,input)=>{const token=text(creds.accessToken||creds.token),owner=text(input.owner),repo=text(input.repo),title=text(input.title);if(!token||!owner||!repo||!title)throw new Error('GitHub token, owner, repo and title are required');const r=await request('https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo)+'/issues',{method:'POST',headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','content-type':'application/json'},body:JSON.stringify({title,body:text(input.body),labels:Array.isArray(input.labels)?input.labels:undefined})});if(!r.ok)throw new Error('GitHub issue creation failed');return {status:r.status,data:r.data};}})});


registerTool({name:'outlook.email.send',description:'Send an email through a connected Microsoft Outlook/Microsoft Graph account.',risk:'high',execute:({input,context})=>run({input,context,provider:'outlook_email',action:'send',risk:'high',handler:async(creds,input)=>{
 const token=text(creds.accessToken||creds.token);const to=Array.isArray(input.to)?input.to.map(text).filter(Boolean):[text(input.to)].filter(Boolean);
 if(!token||!to.length)throw new Error('Outlook access token and recipient are required');
 const subject=text(input.subject);if(!subject)throw new Error('Email subject is required');
 const content=text(input.body||input.text);if(!content)throw new Error('Email body is required');
 const r=await request('https://graph.microsoft.com/v1.0/me/sendMail',{method:'POST',headers:{Authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({message:{subject,body:{contentType:input.html?'HTML':'Text',content},toRecipients:to.map(address=>({emailAddress:{address}}))},saveToSentItems:true})});
 if(!r.ok)throw new Error('Outlook email send failed');
 return {status:r.status};
}})});
registerTool({name:'outlook.email.search',description:'Search messages in a connected Microsoft Outlook/Microsoft Graph mailbox.',risk:'low',execute:({input,context})=>run({input,context,provider:'outlook_email',action:'search',risk:'low',handler:async(creds,input)=>{
 const token=text(creds.accessToken||creds.token);if(!token)throw new Error('Outlook access token is missing');
 const u=new URL('https://graph.microsoft.com/v1.0/me/messages');u.searchParams.set('$top',String(Math.min(50,Math.max(1,Number(input.limit)||20))));u.searchParams.set('$select','id,subject,from,receivedDateTime,isRead,webLink');
 if(text(input.query))u.searchParams.set('$search','"'+text(input.query).replace(/"/g,'')+'"');
 const r=await request(u,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
 if(!r.ok)throw new Error('Outlook mailbox search failed');
 return {status:r.status,data:r.data};
}})});
registerTool({name:'outlook.calendar.create',description:'Create an event in a connected Microsoft Outlook/Microsoft Graph calendar.',risk:'high',execute:({input,context})=>run({input,context,provider:'outlook_calendar',action:'create',risk:'high',handler:async(creds,input)=>{
 const token=text(creds.accessToken||creds.token);if(!token)throw new Error('Outlook Calendar access token is missing');
 const subject=text(input.subject||input.title);const start=text(input.start);const end=text(input.end);if(!subject||!start||!end)throw new Error('Calendar subject, start and end are required');
 const event={subject,start:{dateTime:start,timeZone:text(input.timeZone||'UTC')},end:{dateTime:end,timeZone:text(input.timeZone||'UTC')},body:input.body?{contentType:input.html?'HTML':'Text',content:text(input.body)}:undefined};
 if(Array.isArray(input.attendees))event.attendees=input.attendees.map(v=>({emailAddress:{address:text(v)},type:'required'})).filter(v=>v.emailAddress.address);
 const r=await request('https://graph.microsoft.com/v1.0/me/events',{method:'POST',headers:{Authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(event)});
 if(!r.ok)throw new Error('Outlook Calendar event creation failed');
 return {status:r.status,data:r.data};
}})});
registerTool({name:'outlook.calendar.list',description:'List upcoming events from a connected Microsoft Outlook/Microsoft Graph calendar.',risk:'low',execute:({input,context})=>run({input,context,provider:'outlook_calendar',action:'list',risk:'low',handler:async(creds,input)=>{
 const token=text(creds.accessToken||creds.token);if(!token)throw new Error('Outlook Calendar access token is missing');
 const u=new URL('https://graph.microsoft.com/v1.0/me/calendar/events');u.searchParams.set('$top',String(Math.min(50,Math.max(1,Number(input.limit)||20))));u.searchParams.set('$orderby','start/dateTime');u.searchParams.set('$select','id,subject,start,end,location,organizer,webLink');
 const r=await request(u,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
 if(!r.ok)throw new Error('Outlook Calendar listing failed');
 return {status:r.status,data:r.data};
}})});
