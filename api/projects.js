import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json');
  try{
    const sql=requireSql();
    if(req.method==='GET'){
      const rows=await sql`SELECT p.id,p.type,p.title,p.description,p.status,p.progress,p.expected_release,p.created_at,
        u.username AS artist,
        COUNT(DISTINCT f.user_id)::int AS followers,
        COUNT(DISTINCT CASE WHEN f.expecting THEN f.user_id END)::int AS expecting
        FROM music_projects p JOIN users u ON u.id=p.creator_id
        LEFT JOIN project_followers f ON f.project_id=p.id
        GROUP BY p.id,u.username ORDER BY p.created_at DESC LIMIT 100`;
      return res.status(200).json({data:rows.map(r=>({...r,expectedRelease:r.expected_release,createdAt:r.created_at})),count:rows.length,version:'v1',persistence:'postgresql'});
    }
    if(req.method==='POST'){
      const userId=await readSession(req);
      if(!userId) return res.status(401).json({error:'Authentication required'});
      const body=req.body||{};
      const allowed=['song','episode','album'];
      const title=String(body.title||'').trim();
      if(!title||!allowed.includes(body.type)) return res.status(400).json({error:'title and type (song, episode, album) are required'});
      const progress=Math.max(0,Math.min(100,Number(body.progress)||0));
      const status=['idea','planning','creating','preview','ready','released','after_release'].includes(body.status)?body.status:'idea';
      const rows=await sql`INSERT INTO music_projects(creator_id,type,title,description,status,progress,expected_release)
        VALUES(${userId},${body.type},${title},${String(body.description||'').slice(0,2000)||null},${status},${progress},${body.expectedRelease||null})
        RETURNING id,type,title,description,status,progress,expected_release,created_at`;
      return res.status(201).json({data:rows[0],persistence:'postgresql'});
    }
    res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    return res.status(500).json({error:'Unable to process projects request'});
  }
}
