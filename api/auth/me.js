import { requireSql } from '../../lib/db.js';
import { readSession, publicUser } from '../../lib/auth.js';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    const id=await readSession(req);
    if(!id) return res.status(401).json({error:'Not authenticated'});
    const sql=requireSql();
    const rows=await sql`SELECT id,email,username,created_at FROM users WHERE id=${id} LIMIT 1`;
    if(!rows.length) return res.status(401).json({error:'Session is no longer valid'});
    return res.status(200).json({user:publicUser(rows[0])});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    return res.status(500).json({error:'Unable to read session'});
  }
}
