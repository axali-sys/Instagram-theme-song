import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
  try{
    const sql=requireSql(); const userId=await readSession(req);
    if(!userId) return res.status(401).json({error:'Authentication required'});
    if(req.method==='GET'){
      const rows=await sql`SELECT id,project_id,track_key,song_title,artist,body,visibility,created_at FROM music_moments WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 100`;
      return res.status(200).json({data:rows,persistence:'postgresql'});
    }
    if(req.method==='POST'){
      const b=req.body||{}; const songTitle=String(b.songTitle||'').trim(); const body=String(b.body||'').trim();
      if(!songTitle||!body) return res.status(400).json({error:'songTitle and body are required'});
      const visibility=b.visibility==='shared'?'shared':'private';
      const rows=await sql`INSERT INTO music_moments(user_id,project_id,track_key,song_title,artist,body,visibility)
        VALUES(${userId},${b.projectId||null},${String(b.trackKey||'').trim()||null},${songTitle.slice(0,200)},${String(b.artist||'').trim().slice(0,200)||null},${body.slice(0,5000)},${visibility})
        RETURNING id,project_id,track_key,song_title,artist,body,visibility,created_at`;
      return res.status(201).json({data:rows[0],persistence:'postgresql'});
    }
    if(req.method==='DELETE'){
      const id=String(req.body?.id||req.query?.id||''); if(!id)return res.status(400).json({error:'id is required'});
      await sql`DELETE FROM music_moments WHERE id=${id} AND user_id=${userId}`;
      return res.status(200).json({ok:true});
    }
    res.setHeader('Allow','GET, POST, DELETE'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){ if(e.code==='DATABASE_NOT_CONFIGURED')return res.status(503).json({error:e.message}); if(e.code==='22P02')return res.status(400).json({error:'invalid id'}); return res.status(500).json({error:'Unable to process music moments'}); }
}
