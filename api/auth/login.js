import { requireSql } from '../../lib/db.js';
import { verifyPassword, issueSession, publicUser, setSession } from '../../lib/auth.js';
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const sql=requireSql();
    const email=String(req.body?.email||'').trim().toLowerCase();
    const password=String(req.body?.password||'');
    const rows=await sql`SELECT id,email,username,password_hash,password_salt,created_at FROM users WHERE email=${email} LIMIT 1`;
    if(!rows.length || !verifyPassword(password,rows[0].password_salt,rows[0].password_hash)) return res.status(401).json({error:'Invalid email or password'});
    const token=await issueSession(rows[0].id); setSession(res,token);
    return res.status(200).json({user:publicUser(rows[0])});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED'||e.code==='AUTH_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    return res.status(500).json({error:'Unable to sign in'});
  }
}
