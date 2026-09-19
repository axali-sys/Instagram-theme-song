import { readSession } from '../lib/auth.js';

const MODES=new Set(['discovery','project','audience','profile','moment','release','build']);
const BUILD_ACTIONS=new Set(['plan','request_approval']);
function clean(value,max=4000){return String(value??'').trim().slice(0,max);}
function buildPrompt(mode,input){
  const base=['You are Music Pro Intelligence, an operational AI capability inside Music Pro.','Music Pro remains the product; never present yourself as a separate product or brand.','The listener and creator remain in control. Give useful recommendations and next actions, never make irreversible decisions.','Use only the supplied context. Do not invent listening history, audience numbers, releases, reviews, or artist facts.','Return concise, actionable JSON with keys: summary, insights, nextActions, cautions.','nextActions must be suggestions requiring human approval.'].join(' ');
  const modeText={discovery:'Help interpret a listener discovery request and suggest relevant directions.',project:'Act as a project companion: interpret project state and identify useful next steps.',audience:'Interpret audience signals and expectations without turning them into a simplistic popularity score.',profile:'Help express a user musical identity without changing it without approval.',moment:'Identify whether the supplied listening context could become a Music Moment.',release:'Act as a release navigator: identify missing release-readiness information and useful next actions.',build:'Act as a controlled Music Pro builder: translate a requested feature into a build plan, affected areas, tests, and an approval-gated execution request. Never claim code was changed unless an execution tool confirms it.'}[mode];
  return base+' '+modeText+'\nCONTEXT:\n'+JSON.stringify(input);
}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  const route=String(req.query?.route||'').toLowerCase();
  if(route==='build'){
    if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
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
  const apiKey=process.env.AI_API_KEY,apiUrl=process.env.AI_API_URL,model=process.env.AI_MODEL;
  if(!apiKey||!apiUrl||!model)return res.status(503).json({error:'AI service is not configured',required:['AI_API_URL','AI_API_KEY','AI_MODEL']});
  try{
    const upstream=await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,messages:[{role:'system',content:'Return valid JSON only.'},{role:'user',content:buildPrompt(mode,req.body?.input??{})}],temperature:0.2,response_format:{type:'json_object'}})});
    const raw=await upstream.text();if(!upstream.ok)return res.status(502).json({error:'AI provider request failed',status:upstream.status});
    let payload;try{payload=JSON.parse(raw);}catch{return res.status(502).json({error:'AI provider returned invalid JSON'});}
    const content=payload?.choices?.[0]?.message?.content;if(!content)return res.status(502).json({error:'AI provider returned no content'});
    let result;try{result=JSON.parse(content);}catch{return res.status(502).json({error:'AI provider returned non-JSON content'});}
    return res.status(200).json({ok:true,mode,result});
  }catch{return res.status(502).json({error:'Unable to reach AI provider'});}
}
