import { readSession } from '../../lib/auth.js';

const ALLOWED_ACTIONS = new Set(['plan','request_approval']);

function clean(value,max=4000){return String(value??'').trim().slice(0,max);}

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Method not allowed'});
  }
  const userId=await readSession(req);
  if(!userId) return res.status(401).json({error:'Authentication required'});
  const action=clean(req.body?.action,40);
  const command=clean(req.body?.command,4000);
  if(!ALLOWED_ACTIONS.has(action)) return res.status(400).json({error:'Unsupported build action'});
  if(!command) return res.status(400).json({error:'Build command is required'});
  if(action==='plan'){
    return res.status(200).json({
      ok:true,
      status:'planned',
      command,
      plan:{
        inspect:'Inspect the existing Music Pro implementation before changing it.',
        implement:'Identify the smallest production-safe frontend, API, database and configuration changes required.',
        test:'Run the existing tests and add focused regression coverage.',
        verify:'Verify the resulting flow before reporting completion.',
        approval:'Require human approval before destructive, external, financial, credential, or production-impacting actions.'
      },
      userId
    });
  }
  return res.status(200).json({
    ok:true,
    status:'approval_required',
    command,
    message:'The build request is prepared. No production-changing action has been executed.',
    next:'Human approval is required before execution.',
    userId
  });
}
