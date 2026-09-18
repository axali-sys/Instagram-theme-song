import { requireSql } from '../../../lib/db.js';
import { readSession } from '../../../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const sql=requireSql();
    const userId=await readSession(req);
    if(!userId) return res.status(401).json({error:'Authentication required'});
    if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
    const projectId=req.query?.id;
    const b=req.body||{};
    const values=['overall','quality','connection','replay','expectation','recommendation','review'];
    const clean=Object.fromEntries(values.map(k=>[k,String(b[k]||'').trim().slice(0,500)||null]));
    const rows=await sql`INSERT INTO project_evaluations(project_id,user_id,overall,quality,connection,replay,expectation,recommendation,review)
      VALUES(${projectId},${userId},${clean.overall},${clean.quality},${clean.connection},${clean.replay},${clean.expectation},${clean.recommendation},${clean.review})
      ON CONFLICT(project_id,user_id) DO UPDATE SET overall=EXCLUDED.overall,quality=EXCLUDED.quality,connection=EXCLUDED.connection,replay=EXCLUDED.replay,expectation=EXCLUDED.expectation,recommendation=EXCLUDED.recommendation,review=EXCLUDED.review
      RETURNING id,project_id,overall,quality,connection,replay,expectation,recommendation,review,created_at`;
    return res.status(200).json({ok:true,data:rows[0],persistence:'postgresql'});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    if(e.code==='22P02') return res.status(400).json({error:'invalid project id'});
    return res.status(500).json({error:'Unable to save evaluation'});
  }
}
