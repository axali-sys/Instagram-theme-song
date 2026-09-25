import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
  try{
    const sql=requireSql(); const userId=await readSession(req);
    if(!userId)return res.status(401).json({error:'Authentication required'});
    if(req.method==='GET'){
      const rows=await sql`SELECT p.id,p.name,p.description,p.created_at,p.updated_at,COUNT(i.id)::int AS item_count
        FROM playlists p LEFT JOIN playlist_items i ON i.playlist_id=p.id WHERE p.user_id=${userId}
        GROUP BY p.id ORDER BY p.created_at DESC`;
      return res.status(200).json({data:rows,persistence:'postgresql'});
    }
    if(req.method==='POST'){
      const name=String(req.body?.name||'').trim(); if(!name)return res.status(400).json({error:'name is required'});
      const rows=await sql`INSERT INTO playlists(user_id,name,description) VALUES(${userId},${name.slice(0,120)},${String(req.body?.description||'').slice(0,1000)||null}) RETURNING id,name,description,created_at,updated_at`;
      return res.status(201).json({data:rows[0],persistence:'postgresql'});
    }
    res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){if(e.code==='DATABASE_NOT_CONFIGURED')return res.status(503).json({error:e.message});return res.status(500).json({error:'Unable to process playlists'});}
}
