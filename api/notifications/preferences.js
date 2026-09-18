import { requireSql } from '../../lib/db.js';
import { readSession } from '../../lib/auth.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
  try{const sql=requireSql(); const userId=await readSession(req); if(!userId)return res.status(401).json({error:'Authentication required'});
    if(req.method==='GET'){const rows=await sql`SELECT project_updates,releases,social FROM notification_preferences WHERE user_id=${userId}`; return res.status(200).json({data:rows[0]||{project_updates:true,releases:true,social:true}});}
    if(req.method==='POST'){const p=req.body||{}; const rows=await sql`INSERT INTO notification_preferences(user_id,project_updates,releases,social) VALUES(${userId},${p.project_updates!==false},${p.releases!==false},${p.social!==false}) ON CONFLICT(user_id) DO UPDATE SET project_updates=EXCLUDED.project_updates,releases=EXCLUDED.releases,social=EXCLUDED.social,updated_at=NOW() RETURNING project_updates,releases,social`; return res.status(200).json({data:rows[0],persistence:'postgresql'});}
    res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){if(e.code==='DATABASE_NOT_CONFIGURED')return res.status(503).json({error:e.message});return res.status(500).json({error:'Unable to process notification preferences'});}
}