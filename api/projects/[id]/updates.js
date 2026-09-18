import { requireSql } from '../../../lib/db.js';
import { readSession } from '../../../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json');
  const id=req.query?.id;
  if(!id) return res.status(400).json({error:'Project id is required'});
  try{
    const sql=requireSql();
    if(req.method==='GET'){
      const rows=await sql`SELECT u.id,u.body,u.created_at,a.username AS author FROM project_updates u JOIN users a ON a.id=u.author_id WHERE u.project_id=${id} ORDER BY u.created_at DESC LIMIT 100`;
      return res.status(200).json({data:rows,projectId:id,persistence:'postgresql'});
    }
    if(req.method==='POST'){
      const userId=await readSession(req);
      if(!userId) return res.status(401).json({error:'Authentication required'});
      const owner=await sql`SELECT 1 FROM music_projects WHERE id=${id} AND creator_id=${userId}`;
      if(!owner.length) return res.status(403).json({error:'Only the project creator can post updates'});
      const body=String(req.body?.body||'').trim();
      if(!body) return res.status(400).json({error:'body is required'});
      const rows=await sql`INSERT INTO project_updates(project_id,author_id,body) VALUES(${id},${userId},${body.slice(0,5000)}) RETURNING id,body,created_at`;
      return res.status(201).json({data:rows[0],persistence:'postgresql'});
    }
    res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){ if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message}); if(e.code==='22P02') return res.status(400).json({error:'invalid project id'}); return res.status(500).json({error:'Unable to process project updates'}); }
}