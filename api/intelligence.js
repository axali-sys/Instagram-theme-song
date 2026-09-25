import { rateLimit, clientKey } from '../lib/rate-limit.js';
import { readSession } from '../lib/auth.js';

const MODES=new Set(['discovery','project','audience','profile','moment','release','build']);
const BUILD_ACTIONS=new Set(['plan','request_approval']);
function clean(value,max=4000){return String(value??'').trim().slice(0,max);}
function buildPrompt(mode,input){
  const base=['You are Music Pro Intelligence, an operational AI capability inside Music Pro.','Music Pro remains the product; never present yourself as a separate product or brand.','The listener and creator remain in control. Give useful recommendations and next actions, never make irreversible decisions.','Use only the supplied context. Do not invent listening history, audience numbers, releases, reviews, or artist facts.','Return concise, actionable JSON with keys: summary, insights, nextActions, cautions.','nextActions must be suggestions requiring human approval.'].join(' ');
  const modeText={discovery:'Help interpret a listener discovery request and suggest relevant directions.',project:'Act as a project companion: interpret project state and identify useful next steps.',audience:'Interpret audience signals and expectations without turning them into a simplistic popularity score.',profile:'Help express a user musical identity without changing it without approval.',moment:'Identify whether the supplied listening context could become a Music Moment.',release:'Act as a release navigator: identify missing release-readiness information and useful next actions.',build:'Act as a controlled Music Pro builder: translate a requested feature into a build plan, affected areas, tests, and an approval-gated execution request. Never claim code was changed unless an execution tool confirms it.'}[mode];
  return base+' '+modeText+'\nCONTEXT:\n'+JSON.stringify(input);
}
async function callWronAI({url,key,model,messages}){
  const protocol=String(process.env.WRONAI_PROTOCOL||'openai').toLowerCase();
  const headers={'Content-Type':'application/json'};
  if(key) headers.Authorization=`Bearer ${key}`;
  const body=protocol==='ollama'
    ? {model,messages,stream:false,options:{temperature:0.2}}
    : {model,messages,temperature:0.2,response_format:{type:'json_object'}};
  const upstream=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  const raw=await upstream.text();
  if(!upstream.ok) throw new Error(`WRONAI_HTTP_${upstream.status}`);
  let payload;try{payload=JSON.parse(raw);}catch{throw new Error('WRONAI_INVALID_JSON');}
  const content=protocol==='ollama'
    ? payload?.message?.content
    : payload?.choices?.[0]?.message?.content;
  if(!content) throw new Error('WRONAI_NO_CONTENT');
  return content;
}
async function callConfiguredAI({url,key,model,messages}){
  const upstream=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,messages,temperature:0.2,response_format:{type:'json_object'}}),signal:AbortSignal.timeout(30000)});
  const raw=await upstream.text();if(!upstream.ok)throw new Error(`AI_HTTP_${upstream.status}`);
  let payload;try{payload=JSON.parse(raw);}catch{throw new Error('AI_INVALID_JSON');}
  const content=payload?.choices?.[0]?.message?.content;if(!content)throw new Error('AI_NO_CONTENT');
  return content;
}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  const route=String(req.query?.route||'').toLowerCase();
  if(route==='build'){
    if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const guard=rateLimit(clientKey(req,'ai'),{limit:30,windowMs:60*1000});
  if(!guard.allowed){res.setHeader('Retry-After',String(guard.retryAfter));return res.status(429).json({error:'Too many AI requests'});}
    const userId=await readSession(req);if(!userId)return res.status(401).json({error:'Authentication required'});
    const action=clean(req.body?.action,40),command=clean(req.body?.command,4000);
    if(!BUILD_ACTIONS.has(action))return res.status(400).json({error:'Unsupported build action'});
    if(!command)return res.status(400).json({error:'Build command is required'});
    if(action==='plan')return res.status(200).json({ok:true,status:'planned',command,plan:{inspect:'Inspect the existing Music Pro implementation before changing it.',implement:'Identify the smallest production-safe frontend, API, database and configuration changes required.',test:'Run the existing tests and add focused regression coverage.',verify:'Verify the resulting flow before reporting completion.',approval:'Require human approval before destructive, external, financial, credential, or production-impacting actions.'},userId});
    return res.status(200).json({ok:true,status:'approval_required',command,message:'The build request is prepared. No production-changing action has been executed.',next:'Human approval is required before execution.',userId});
  }
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const userId=await readSession(req);if(!userId)return res.status(401).json({error:'Authentication required'});
  const mode=clean(req.body?.mode,40);
  if(!MODES.has(mode))return res.status(400).json({error:'Unsupported intelligence mode'});
  const useWronAI=String(process.env.AI_PROVIDER||'').toLowerCase()==='wronai';
  const apiUrl=useWronAI?process.env.WRONAI_API_URL:process.env.AI_API_URL;
  const apiKey=useWronAI?process.env.WRONAI_API_KEY:process.env.AI_API_KEY;
  const model=useWronAI?process.env.WRONAI_MODEL:process.env.AI_MODEL;
  if(!apiUrl||(!useWronAI&&!apiKey)||!model)return res.status(503).json({error:useWronAI?'WronAI service is not configured':'AI service is not configured',required:useWronAI?['WRONAI_API_URL','WRONAI_MODEL']:['AI_API_URL','AI_API_KEY','AI_MODEL']});
  try{
    const messages=[{role:'system',content:'Return valid JSON only.'},{role:'user',content:buildPrompt(mode,req.body?.input??{})}];
    const content=useWronAI?await callWronAI({url:apiUrl,key:apiKey,model,messages}):await callConfiguredAI({url:apiUrl,key:apiKey,model,messages});
    let result;try{result=JSON.parse(content);}catch{return res.status(502).json({error:'AI provider returned non-JSON content'});}
    return res.status(200).json({ok:true,mode,provider:useWronAI?'wronai':'configured',result});
  }catch(error){
    const code=String(error?.message||'');
    if(code.startsWith('WRONAI_'))return res.status(502).json({error:'Unable to reach WronAI',code});
    return res.status(502).json({error:'Unable to reach AI provider'});
  }
}
