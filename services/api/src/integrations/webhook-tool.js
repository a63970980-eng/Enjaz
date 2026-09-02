import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { registerTool } from '../tool-registry.js';

function privateIpv4(ip){const p=ip.split('.').map(Number);return p.length===4&&(p[0]===10||p[0]===127||p[0]===0||p[0]===169&&p[1]===254||p[0]===172&&p[1]>=16&&p[1]<=31||p[0]===192&&p[1]===168||p[0]>=224);}
function privateIpv6(ip){const v=ip.toLowerCase().split('%')[0];return v==='::'||v==='::1'||v.startsWith('fc')||v.startsWith('fd')||v.startsWith('fe8')||v.startsWith('fe9')||v.startsWith('fea')||v.startsWith('feb')||v.startsWith('ff');}
function unsafeAddress(ip){if(isIP(ip)===4)return privateIpv4(ip);if(isIP(ip)===6)return privateIpv6(ip);return true;}
async function validateWebhookUrl(raw){
 let url;try{url=new URL(raw);}catch{throw new Error('Invalid webhook URL');}
 if(url.protocol!=='https:')throw new Error('Only HTTPS webhook URLs are allowed');
 if(url.username||url.password)throw new Error('Webhook URL credentials are not allowed');
 if(url.port&&url.port!=='443')throw new Error('Webhook must use HTTPS port 443');
 if(isIP(url.hostname)){if(unsafeAddress(url.hostname))throw new Error('Webhook target resolves to a non-public address');return url;}
 const addresses=await lookup(url.hostname,{all:true,verbatim:true});
 if(!addresses.length||addresses.some(a=>unsafeAddress(a.address)))throw new Error('Webhook target resolves to a non-public address');
 return url;
}

registerTool({
 name:'webhook.request',
 description:'Send a JSON request to a customer-configured public HTTPS webhook.',
 risk:'high',
 execute:async({input,context={}})=>{
  const url=await validateWebhookUrl(input?.url);
  const method=String(input?.method||'POST').toUpperCase();
  if(!['POST','PUT','PATCH','GET'].includes(method))throw new Error('Unsupported webhook method');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10_000);
  try{
   const headers={'Content-Type':'application/json','Accept':'application/json,text/plain;q=0.9,*/*;q=0.1'};
   if(typeof context.executionKey==='string'&&context.executionKey)headers['Idempotency-Key']=context.executionKey.slice(0,200);
   const init={method,headers,redirect:'error',signal:controller.signal};
   if(method!=='GET')init.body=JSON.stringify(input.payload||{});
   const response=await fetch(url,init);
   const text=await response.text();
   return {status:response.status,ok:response.ok,body:text.slice(0,5000)};
  }catch(error){if(error?.name==='AbortError')throw new Error('Webhook request timed out');throw error;}finally{clearTimeout(timer);}
 }
});
