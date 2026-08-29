import { registerTool } from '../tool-registry.js';

registerTool({
  name:'webhook.request',
  description:'Send a JSON request to a customer-configured HTTPS webhook.',
  risk:'high',
  execute:async({input})=>{
    const url=input?.url;
    if(!url||typeof url!=='string'||!url.startsWith('https://')) throw new Error('Only HTTPS webhook URLs are allowed');
    const response=await fetch(url,{method:input.method||'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input.payload||{})});
    const text=await response.text();
    return {status:response.status,ok:response.ok,body:text.slice(0,5000)};
  }
});
