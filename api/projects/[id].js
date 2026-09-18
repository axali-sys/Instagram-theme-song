import { requireSql } from '../../lib/db.js';
import { readSession } from '../../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json');
  const id=req.query?.id;
  if(!id) return res.status(400).json({error:'Project id is required'});
  try{
    const sql=requireSql();
    if(req.method==='GET'){
      const rows=await sql`SELECT p.id,p.type,p.title,p.description,p.status,p.progress,p.expected_release,p.created_at,
        u.username AS artist,
        COUNT(DISTINCT f.user_id)::int AS followers,
        COUNT(DISTINCT CASE WHEN f.expecting THEN f.user_id END)::int AS expecting,
        COUNT(DISTINCT CASE WHEN f.saved THEN f.user_id END)::int AS saved
        FROM music_projects p JOIN users u ON u.id=p.creator_id
        LEFT JOIN project_followers f ON f.project_id=p.id
        WHERE p.id=${id}
        GROUP BY p.id,u.username`;
      if(!rows.length) return res.status(404).json({error:'Project not found'});
      const r=rows[0];
      return res.status(200).json({data:{...r,expectedRelease:r.expected_release,createdAt:r.created_at},version:'v1',persistence:'postgresql'});
    }
    if(req.method==='POST'){
      const userId=await readSession(req);
      if(!userId) return res.status(401).json({error:'Authentication required'});
      const action=String(req.body?.action||'');
      const allowed=['follow','unfollow','expect','unexpect','save','unsave'];
      if(!allowed.includes(action)) return res.status(400).json({error:'unsupported project action'});
      if(action==='follow') await sql`INSERT INTO project_followers(project_id,user_id) VALUES(${id},${userId}) ON CONFLICT(project_id,user_id) DO NOTHING`;
      if(action==='unfollow') await sql`DELETE FROM project_followers WHERE project_id=${id} AND user_id=${userId}`;
      if(action==='expect') await sql`INSERT INTO project_followers(project_id,user_id,expecting) VALUES(${id},${userId},true) ON CONFLICT(project_id,user_id) DO UPDATE SET expecting=true`;
      if(action==='unexpect') await sql`UPDATE project_followers SET expecting=false WHERE project_id=${id} AND user_id=${userId}`;
      if(action==='save') await sql`INSERT INTO project_followers(project_id,user_id,saved) VALUES(${id},${userId},true) ON CONFLICT(project_id,user_id) DO UPDATE SET saved=true`;
      if(action==='unsave') await sql`UPDATE project_followers SET saved=false WHERE project_id=${id} AND user_id=${userId}`;
      return res.status(200).json({ok:true,projectId:id,action,persistence:'postgresql'});
    }
    res.setHeader('Allow','GET, POST');
    return res.status(405).json({error:'Method not allowed'});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    if(e.code==='22P02') return res.status(400).json({error:'invalid project id'});
    return res.status(500).json({error:'Unable to process project request'});
  }
}
