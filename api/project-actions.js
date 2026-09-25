import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json');
  const id=String(req.query?.id||'');
  const action=String(req.query?.action||'').toLowerCase();
  if(!id) return res.status(400).json({error:'Project id is required'});
  try{
    const sql=requireSql();
    const userId=await readSession(req);
    if(!userId) return res.status(401).json({error:'Authentication required'});

    if(action==='follow' || action==='like'){
      if(req.method==='GET'){
        if(action==='follow'){
          const rows=await sql`SELECT 1 FROM project_followers WHERE project_id=${id} AND user_id=${userId}`;
          return res.status(200).json({following:Boolean(rows.length)});
        }
        const rows=await sql`SELECT 1 FROM project_likes WHERE project_id=${id} AND user_id=${userId}`;
        return res.status(200).json({liked:Boolean(rows.length)});
      }
      if(req.method!=='POST' && req.method!=='DELETE') return res.status(405).json({error:'Method not allowed'});
      const project=await sql`SELECT creator_id,title FROM music_projects WHERE id=${id}`;
      if(!project.length)return res.status(404).json({error:'Project not found'});
      const enabled=req.method==='POST';
      if(action==='follow'){
        if(enabled){
          await sql`INSERT INTO project_followers(project_id,user_id) VALUES(${id},${userId}) ON CONFLICT(project_id,user_id) DO NOTHING`;
          if(project[0].creator_id!==userId) await sql`INSERT INTO notifications(user_id,type,title,body,project_id) VALUES(${project[0].creator_id},'social','New project follower',${'A listener followed '+project[0].title},${id})`;
        }else await sql`DELETE FROM project_followers WHERE project_id=${id} AND user_id=${userId}`;
        return res.status(200).json({following:enabled});
      }
      if(enabled){
        await sql`INSERT INTO project_likes(project_id,user_id) VALUES(${id},${userId}) ON CONFLICT(project_id,user_id) DO NOTHING`;
      }else await sql`DELETE FROM project_likes WHERE project_id=${id} AND user_id=${userId}`;
      return res.status(200).json({liked:enabled});
    }

    if(action==='evaluate'){
      if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
      const b=req.body||{};
      const values=['overall','quality','connection','replay','expectation','recommendation','review'];
      const clean=Object.fromEntries(values.map(k=>[k,String(b[k]||'').trim().slice(0,500)||null]));
      const rows=await sql`INSERT INTO project_evaluations(project_id,user_id,overall,quality,connection,replay,expectation,recommendation,review)
        VALUES(${id},${userId},${clean.overall},${clean.quality},${clean.connection},${clean.replay},${clean.expectation},${clean.recommendation},${clean.review})
        ON CONFLICT(project_id,user_id) DO UPDATE SET overall=EXCLUDED.overall,quality=EXCLUDED.quality,connection=EXCLUDED.connection,replay=EXCLUDED.replay,expectation=EXCLUDED.expectation,recommendation=EXCLUDED.recommendation,review=EXCLUDED.review
        RETURNING id,project_id,overall,quality,connection,replay,expectation,recommendation,review,created_at`;
      return res.status(200).json({ok:true,data:rows[0],persistence:'postgresql'});
    }

    if(action==='expectations'){
      if(req.method==='GET'){
        const rows=await sql`SELECT expectations FROM project_followers WHERE project_id=${id} AND user_id=${userId}`;
        return res.status(200).json({data:{projectId:id,expectations:rows[0]?.expectations||[]},version:'v1',persistence:'postgresql'});
      }
      if(req.method==='POST'){
        const raw=req.body?.expectations;
        if(!Array.isArray(raw)) return res.status(400).json({error:'expectations must be an array'});
        const allowed=new Set(['release_date','new_episode','full_album','new_sound','collaboration','story_continuation']);
        const expectations=[...new Set(raw.map(v=>String(v).trim()).filter(Boolean))];
        const invalid=expectations.filter(v=>!allowed.has(v));
        if(invalid.length) return res.status(400).json({error:'unsupported expectation',invalid});
        await sql`INSERT INTO project_followers(project_id,user_id,expectations,expecting) VALUES(${id},${userId},${expectations},${expectations.length>0})
          ON CONFLICT(project_id,user_id) DO UPDATE SET expectations=EXCLUDED.expectations,expecting=EXCLUDED.expecting`;
        return res.status(200).json({ok:true,projectId:id,expectations,persistence:'postgresql'});
      }
      return res.status(405).json({error:'Method not allowed'});
    }

    if(action==='milestones'){
      if(req.method==='GET'){
        const rows=await sql`SELECT id,title,description,status,due_at,completed_at,created_at,updated_at FROM project_milestones WHERE project_id=${id} ORDER BY created_at ASC`;
        return res.status(200).json({data:rows,projectId:id,persistence:'postgresql'});
      }
      if(req.method==='POST'){
        const owner=await sql`SELECT 1 FROM music_projects WHERE id=${id} AND creator_id=${userId}`;
        if(!owner.length) return res.status(403).json({error:'Only the project creator can add milestones'});
        const title=String(req.body?.title||'').trim();
        if(!title) return res.status(400).json({error:'title is required'});
        const status=['planned','in_progress','completed'].includes(req.body?.status)?req.body.status:'planned';
        const description=String(req.body?.description||'').slice(0,2000)||null;
        const rows=await sql`INSERT INTO project_milestones(project_id,title,description,status,due_at) VALUES(${id},${title},${description},${status},${req.body?.dueAt||null}) RETURNING *`;
        await sql`INSERT INTO notifications(user_id,type,title,body,project_id) SELECT f.user_id,'project_updates',${'Project milestone updated'},${title+' is now '+status.replace('_',' ')},${id} FROM project_followers f LEFT JOIN notification_preferences np ON np.user_id=f.user_id WHERE f.project_id=${id} AND COALESCE(np.project_updates,true)=true AND f.user_id<>${userId}`;
        return res.status(201).json({data:rows[0],persistence:'postgresql'});
      }
      return res.status(405).json({error:'Method not allowed'});
    }

    if(action==='updates'){
      if(req.method==='GET'){
        const rows=await sql`SELECT u.id,u.body,u.created_at,a.username AS author FROM project_updates u JOIN users a ON a.id=u.author_id WHERE u.project_id=${id} ORDER BY u.created_at DESC LIMIT 100`;
        return res.status(200).json({data:rows,projectId:id,persistence:'postgresql'});
      }
      if(req.method==='POST'){
        const owner=await sql`SELECT 1 FROM music_projects WHERE id=${id} AND creator_id=${userId}`;
        if(!owner.length) return res.status(403).json({error:'Only the project creator can post updates'});
        const body=String(req.body?.body||'').trim();
        if(!body) return res.status(400).json({error:'body is required'});
        const rows=await sql`INSERT INTO project_updates(project_id,author_id,body) VALUES(${id},${userId},${body.slice(0,5000)}) RETURNING id,body,created_at`;
        await sql`INSERT INTO notifications(user_id,type,title,body,project_id) SELECT f.user_id,'project_updates',${'New project update'},${body.slice(0,500)},${id} FROM project_followers f LEFT JOIN notification_preferences np ON np.user_id=f.user_id WHERE f.project_id=${id} AND COALESCE(np.project_updates,true)=true AND f.user_id<>${userId}`;
        return res.status(201).json({data:rows[0],persistence:'postgresql'});
      }
      return res.status(405).json({error:'Method not allowed'});
    }

    return res.status(404).json({error:'Unknown project action'});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    if(e.code==='22P02') return res.status(400).json({error:'invalid project id'});
    return res.status(500).json({error:'Unable to process project action'});
  }
}
