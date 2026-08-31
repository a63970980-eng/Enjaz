const buckets = new Map();

export function rateLimit({windowMs=60_000,max=120}={}){
 return (key)=>{
  const now=Date.now();
  const current=buckets.get(key);
  if(!current||now-current.started>=windowMs){buckets.set(key,{started:now,count:1});return {allowed:true,remaining:max-1,resetAt:now+windowMs};}
  current.count++;
  return {allowed:current.count<=max,remaining:Math.max(0,max-current.count),resetAt:current.started+windowMs};
 };
}
export function clearRateLimitStore(){buckets.clear();}
