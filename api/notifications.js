import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
  try{ const sql=requireSql(); const userId=await readSession(req); if(!userId)return res.status(401).json({error:'Authentication required'});
    if(req.method==='GET'){const rows=await sql`SELECT id,type,title,body,project_id,read_at,created_at FROM notifications WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 100`; return res.status(200).json({data:rows,unread:rows.filter(x=>!x.read_at).length,persistence:'postgresql'});}
    if(req.method==='POST'){const id=req.body?.id; if(req.body?.action==='read'){if(id) await sql`UPDATE notifications SET read_at=NOW() WHERE id=${id} AND user_id=${userId}`; else await sql`UPDATE notifications SET read_at=NOW() WHERE user_id=${userId} AND read_at IS NULL`; return res.status(200).json({ok:true});} return res.status(400).json({error:'unsupported notification action'});}
    res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){if(e.code==='DATABASE_NOT_CONFIGURED')return res.status(503).json({error:e.message});return res.status(500).json({error:'Unable to process notifications'});}
}