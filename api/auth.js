import { requireSql } from '../lib/db.js';
import { hashPassword, verifyPassword, issueSession, publicUser, setSession, clearSession, readSession } from '../lib/auth.js';

export default async function handler(req,res){
  const route=String(req.query?.route||'').toLowerCase();
  try{
    if(route==='logout'){
      if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
      clearSession(res);
      return res.status(200).json({ok:true});
    }
    if(route==='me'){
      if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
      const id=await readSession(req);
      if(!id) return res.status(401).json({error:'Not authenticated'});
      const sql=requireSql();
      const rows=await sql`SELECT id,email,username,created_at FROM users WHERE id=${id} LIMIT 1`;
      if(!rows.length) return res.status(401).json({error:'Session is no longer valid'});
      return res.status(200).json({user:publicUser(rows[0])});
    }
    if(route==='register'){
      if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
      const sql=requireSql();
      const {email,password,username}=req.body||{};
      const normalized=String(email||'').trim().toLowerCase();
      const name=String(username||'').trim().replace(/^@/,'');
      if(!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/.test(normalized)) return res.status(400).json({error:'valid email is required'});
      if(String(password||'').length<8) return res.status(400).json({error:'password must be at least 8 characters'});
      if(!/^[a-zA-Z0-9_]{3,30}$/.test(name)) return res.status(400).json({error:'username must be 3-30 characters: letters, numbers or underscore'});
      const exists=await sql`SELECT id FROM users WHERE email=${normalized} OR username=${name} LIMIT 1`;
      if(exists.length) return res.status(409).json({error:'email or username already exists'});
      const {salt,hash}=hashPassword(password);
      const rows=await sql`INSERT INTO users(email,username,password_hash,password_salt) VALUES(${normalized},${name},${hash},${salt}) RETURNING id,email,username,created_at`;
      const token=await issueSession(rows[0].id); setSession(res,token);
      return res.status(201).json({user:publicUser(rows[0])});
    }
    if(route==='login'){
      if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
      const sql=requireSql();
      const email=String(req.body?.email||'').trim().toLowerCase();
      const password=String(req.body?.password||'');
      const rows=await sql`SELECT id,email,username,password_hash,password_salt,created_at FROM users WHERE email=${email} LIMIT 1`;
      if(!rows.length || !verifyPassword(password,rows[0].password_salt,rows[0].password_hash)) return res.status(401).json({error:'Invalid email or password'});
      const token=await issueSession(rows[0].id); setSession(res,token);
      return res.status(200).json({user:publicUser(rows[0])});
    }
    return res.status(404).json({error:'Unknown auth route'});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED'||e.code==='AUTH_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    return res.status(500).json({error:'Unable to process authentication request'});
  }
}
