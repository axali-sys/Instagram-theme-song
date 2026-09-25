const buckets=new Map();

export function rateLimit(key,{limit=30,windowMs=60000}={}){
  const now=Date.now();
  const current=buckets.get(key);
  if(!current||current.resetAt<=now){
    const next={count:1,resetAt:now+windowMs}; buckets.set(key,next);
    return {allowed:true,retryAfter:0};
  }
  current.count+=1;
  if(current.count>limit) return {allowed:false,retryAfter:Math.max(1,Math.ceil((current.resetAt-now)/1000))};
  return {allowed:true,retryAfter:0};
}

export function clientKey(req,scope){
  const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  const ip=forwarded||String(req.headers['x-real-ip']||'unknown');
  return scope+':'+ip;
}
