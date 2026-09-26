import { registerTool } from '../tool-registry.js';
import { getConnectionCredentials, logIntegrationAction } from '../credentials-vault.js';

const text=v=>String(v??'').trim();
const APPS={
 google_workspace:{name:'Google Workspace',hosts:['googleapis.com'],providers:['google_workspace']},
 gmail:{name:'Gmail',hosts:['gmail.googleapis.com'],providers:['gmail']},
 google_calendar:{name:'Google Calendar',hosts:['www.googleapis.com'],providers:['google_calendar']},
 google_drive:{name:'Google Drive',hosts:['www.googleapis.com'],providers:['google_drive']},
 microsoft_365:{name:'Microsoft 365',hosts:['graph.microsoft.com'],providers:['microsoft_365']},
 outlook_email:{name:'Outlook Email',hosts:['graph.microsoft.com'],providers:['outlook_email']},
 outlook_calendar:{name:'Outlook Calendar',hosts:['graph.microsoft.com'],providers:['outlook_calendar']},
 slack:{name:'Slack',hosts:['slack.com','hooks.slack.com'],providers:['slack']},
 microsoft_teams:{name:'Microsoft Teams',hosts:['webhook.office.com','graph.microsoft.com'],providers:['microsoft_teams']},
 discord:{name:'Discord',hosts:['discord.com','discordapp.com'],providers:['discord']},
 hubspot:{name:'HubSpot',hosts:['api.hubapi.com'],providers:['hubspot']},
 salesforce:{name:'Salesforce',hosts:['salesforce.com'],providers:['salesforce']},
 stripe:{name:'Stripe',hosts:['api.stripe.com'],providers:['stripe']},
 shopify:{name:'Shopify',hosts:['myshopify.com'],providers:['shopify']},
 quickbooks:{name:'QuickBooks',hosts:['quickbooks.api.intuit.com'],providers:['quickbooks']},
 xero:{name:'Xero',hosts:['api.xero.com'],providers:['xero']},
 jira:{name:'Jira',hosts:['atlassian.net'],providers:['jira']},
 confluence:{name:'Confluence',hosts:['atlassian.net'],providers:['confluence']},
 asana:{name:'Asana',hosts:['app.asana.com','asana.com'],providers:['asana']},
 trello:{name:'Trello',hosts:['api.trello.com'],providers:['trello']},
 linear:{name:'Linear',hosts:['api.linear.app'],providers:['linear']},
 notion:{name:'Notion',hosts:['api.notion.com'],providers:['notion']},
 airtable:{name:'Airtable',hosts:['api.airtable.com'],providers:['airtable']},
 dropbox:{name:'Dropbox',hosts:['api.dropboxapi.com','content.dropboxapi.com'],providers:['dropbox']},
 github:{name:'GitHub',hosts:['api.github.com'],providers:['github']},
 gitlab:{name:'GitLab',hosts:['gitlab.com'],providers:['gitlab']},
 bitbucket:{name:'Bitbucket',hosts:['api.bitbucket.org'],providers:['bitbucket']},
 twilio:{name:'Twilio',hosts:['api.twilio.com'],providers:['twilio']},
 zoom:{name:'Zoom',hosts:['api.zoom.us'],providers:['zoom']},
 n8n:{name:'n8n',hosts:['n8n.cloud'],providers:['n8n']},
 webhooks:{name:'Webhooks',hosts:[],providers:['webhook']}
};

function allowed(url,hosts){
 let u;try{u=new URL(url)}catch{throw new Error('Invalid integration URL')};
 if(u.protocol!=='https:'||u.username||u.password)throw new Error('Integration URL must be HTTPS without embedded credentials');
 if(hosts.length&&!hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw new Error('Integration host is not allowed for this app');
 return u;
}
function authHeaders(credentials){
 const token=text(credentials?.accessToken||credentials?.token||credentials?.apiKey);
 if(!token)throw new Error('Integration credential is missing');
 return {Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'};
}
registerTool({
 name:'app.catalog.list',
 description:'List the supported external business applications available to Enjaz.',
 risk:'low',
 execute:async()=>({type:'app_catalog',apps:Object.entries(APPS).map(([id,v])=>({id,...v}))})
});
registerTool({
 name:'app.api.request',
 description:'Call an allowlisted API of a connected external application using encrypted credentials.',
 risk:'high',
 execute:async({input,context})=>{
  const appId=text(input?.app);const app=APPS[appId];if(!app)throw new Error('Unsupported external application');
  const connectionId=text(input?.connectionId);if(!connectionId)throw new Error('connectionId is required');
  const c=await getConnectionCredentials({workspaceId:context.workspaceId,connectionId,provider:app.providers[0]});
  const u=allowed(input?.url,app.hosts);
  const method=text(input?.method||'GET').toUpperCase();if(!['GET','POST','PUT','PATCH','DELETE'].includes(method))throw new Error('Unsupported API method');
  const headers={...authHeaders(c.credentials)};const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
   const init={method,headers,redirect:'error',signal:controller.signal};
   if(method!=='GET'&&method!=='DELETE')init.body=JSON.stringify(input?.body&&typeof input.body==='object'?input.body:{});
   const r=await fetch(u,init);const raw=await r.text();let data=raw;try{data=raw?JSON.parse(raw):{}}catch{}
   await logIntegrationAction({workspaceId:context.workspaceId,taskId:context.taskId,employeeId:context.employeeId,connectionId:c.id,provider:c.provider,action:'api.request',status:r.ok?'succeeded':'failed',requestMeta:{app:appId,method,path:u.pathname},responseMeta:{status:r.status}});
   if(!r.ok)throw new Error(app.name+' API request failed with HTTP '+r.status);
   return {type:'external_api_result',app:appId,status:r.status,data};
  }catch(error){
   if(error?.name==='AbortError')throw new Error('External API request timed out');
   throw error;
  }finally{clearTimeout(timer)}
 }
});
