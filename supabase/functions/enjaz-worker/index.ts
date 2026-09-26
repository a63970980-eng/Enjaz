import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const out=(x:unknown,s=200)=>new Response(JSON.stringify(x),{
  status:s,
  headers:{"content-type":"application/json; charset=utf-8","x-content-type-options":"nosniff","x-frame-options":"DENY"}
});

Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok");
  if(req.method!=="POST") return out({error:"Method not allowed"},405);

  const base=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!base||!service) return out({error:"Production worker is not configured"},503);

  const token=String(req.headers.get("X-Enjaz-Worker-Token")||"").trim();
  if(!token) return out({error:"Worker authentication required"},401);

  const db=createClient(base,service);
  const {data:valid,error}=await db.rpc("enjaz_worker_token_valid",{p_token:token});
  if(error||valid!==true) return out({error:"Invalid worker token"},401);

  const body=await req.json().catch(()=>({}));
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  try{
    const r=await fetch("https://enjaz-eight.vercel.app/api/v1/runtime/process",{
      method:"POST",
      signal:controller.signal,
      headers:{
        "Content-Type":"application/json",
        "X-Enjaz-Worker-Token":token
      },
      body:JSON.stringify({limit:Math.min(Math.max(Number(body?.limit||6),1),6),time:new Date().toISOString()})
    });
    const text=await r.text();
    let data:unknown=text;
    try{data=JSON.parse(text)}catch{}
    return out(data,r.status);
  }catch(error){
    if(error instanceof Error&&error.name==="AbortError") return out({error:"Worker processing timed out"},504);
    return out({error:error instanceof Error?error.message:"Worker processing failed"},502);
  }finally{
    clearTimeout(timer);
  }
});
