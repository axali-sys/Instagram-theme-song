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
      const rows=await sql`SELECT id,title,description,status,due_at,completed_at,created_at,updated_at FROM project_milestones WHERE project_id=${id} ORDER BY created_at ASC`;
      return res.status(200).json({data:rows,projectId:id,persistence:'postgresql'});
    }
    if(req.method==='POST'){
      const userId=await readSession(req);
      if(!userId) return res.status(401).json({error:'Authentication required'});
      const owner=await sql`SELECT 1 FROM music_projects WHERE id=${id} AND creator_id=${userId}`;
      if(!owner.length) return res.status(403).json({error:'Only the project creator can add milestones'});
      const title=String(req.body?.title||'').trim();
      if(!title) return res.status(400).json({error:'title is required'});
      const rows=await sql`INSERT INTO project_milestones(project_id,title,description,status,due_at) VALUES(${id},${title},${String(req.body?.description||'').slice(0,2000)||null},${['planned','in_progress','completed'].includes(req.body?.status)?req.body.status:'planned'},${req.body?.dueAt||null}) RETURNING *`;
      return res.status(201).json({data:rows[0],persistence:'postgresql'});
    }
    res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){ if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message}); if(e.code==='22P02') return res.status(400).json({error:'invalid project id'}); return res.status(500).json({error:'Unable to process milestones'}); }
}