const buckets = new Map();

export function rateLimit({windowMs=60_000,max=120,maxKeys=10_000}={}){
 if(!Number.isFinite(windowMs)||windowMs<=0)throw new Error('windowMs must be positive');
 if(!Number.isInteger(max)||max<=0)throw new Error('max must be a positive integer');
 if(!Number.isInteger(maxKeys)||maxKeys<=0)throw new Error('maxKeys must be a positive integer');
 return (key)=>{
  const now=Date.now();
  const current=buckets.get(key);
  if(!current||now-current.started>=windowMs){
   if(buckets.size>=maxKeys){
    for(const [k,v] of buckets){if(now-v.started>=windowMs)buckets.delete(k);}
    if(buckets.size>=maxKeys)buckets.delete(buckets.keys().next().value);
   }
   buckets.set(key,{started:now,count:1});
   return {allowed:true,remaining:max-1,resetAt:now+windowMs};
  }
  current.count++;
  return {allowed:current.count<=max,remaining:Math.max(0,max-current.count),resetAt:current.started+windowMs};
 };
}
export function clearRateLimitStore(){buckets.clear();}
export function getRateLimitStoreSize(){return buckets.size;}
