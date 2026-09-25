import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
  try{
    const sql=requireSql(); const userId=await readSession(req);
    if(!userId)return res.status(401).json({error:'Authentication required'});
    if(req.method==='GET'){
      const rows=await sql`SELECT track_key,title,artist,created_at FROM favorites WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 200`;
      return res.status(200).json({data:rows,persistence:'postgresql'});
    }
    if(req.method==='POST'){
      const b=req.body||{}; const key=String(b.trackKey||'').trim(); const title=String(b.title||'').trim();
      if(!key||!title)return res.status(400).json({error:'trackKey and title are required'});
      const rows=await sql`INSERT INTO favorites(user_id,track_key,title,artist) VALUES(${userId},${key.slice(0,300)},${title.slice(0,300)},${String(b.artist||'').trim().slice(0,200)||null})
        ON CONFLICT(user_id,track_key) DO UPDATE SET title=EXCLUDED.title,artist=EXCLUDED.artist RETURNING track_key,title,artist,created_at`;
      return res.status(200).json({data:rows[0],saved:true,persistence:'postgresql'});
    }
    if(req.method==='DELETE'){
      const key=String(req.body?.trackKey||req.query?.trackKey||'').trim(); if(!key)return res.status(400).json({error:'trackKey is required'});
      await sql`DELETE FROM favorites WHERE user_id=${userId} AND track_key=${key}`; return res.status(200).json({ok:true,saved:false});
    }
    res.setHeader('Allow','GET, POST, DELETE'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){if(e.code==='DATABASE_NOT_CONFIGURED')return res.status(503).json({error:e.message});return res.status(500).json({error:'Unable to process favorites'});}
}
