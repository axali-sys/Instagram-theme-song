import { requireSql } from '../../lib/db.js';
import { hashPassword, issueSession, publicUser, setSession } from '../../lib/auth.js';
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const sql=requireSql();
    const {email,password,username}=req.body||{};
    const normalized=String(email||'').trim().toLowerCase();
    const name=String(username||'').trim().replace(/^@/,'');
    if(!/^\\S+@\\S+\\.\\S+$/.test(normalized)) return res.status(400).json({error:'valid email is required'});
    if(String(password||'').length<8) return res.status(400).json({error:'password must be at least 8 characters'});
    if(!/^[a-zA-Z0-9_]{3,30}$/.test(name)) return res.status(400).json({error:'username must be 3-30 characters: letters, numbers or underscore'});
    const exists=await sql`SELECT id FROM users WHERE email=${normalized} OR username=${name} LIMIT 1`;
    if(exists.length) return res.status(409).json({error:'email or username already exists'});
    const {salt,hash}=hashPassword(password);
    const rows=await sql`INSERT INTO users(email,username,password_hash,password_salt) VALUES(${normalized},${name},${hash},${salt}) RETURNING id,email,username,created_at`;
    const token=await issueSession(rows[0].id); setSession(res,token);
    return res.status(201).json({user:publicUser(rows[0])});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED'||e.code==='AUTH_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    return res.status(500).json({error:'Unable to create account'});
  }
}
