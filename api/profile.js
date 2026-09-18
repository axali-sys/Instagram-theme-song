import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json');
  try{
    const sql=requireSql();
    const userId=await readSession(req);
    if(req.method==='GET'){
      if(!userId) return res.status(401).json({error:'Authentication required'});
      const rows=await sql`SELECT u.id,u.username,p.display_name,p.bio,p.theme_song_title,p.theme_song_artist,p.primary_sound
        FROM users u LEFT JOIN music_profiles p ON p.user_id=u.id WHERE u.id=${userId} LIMIT 1`;
      if(!rows.length) return res.status(404).json({error:'Profile not found'});
      const r=rows[0];
      return res.status(200).json({data:{id:r.id,username:r.username,displayName:r.display_name,bio:r.bio,themeSong:r.theme_song_title,themeArtist:r.theme_song_artist,primarySound:r.primary_sound},version:'v1',persistence:'postgresql'});
    }
    if(req.method==='POST'){
      if(!userId) return res.status(401).json({error:'Authentication required'});
      const body=req.body||{};
      const username=String(body.username||'').trim().replace(/^@/,'');
      if(!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return res.status(400).json({error:'valid username is required'});
      await sql`UPDATE users SET username=${username} WHERE id=${userId}`;
      const themeSong=String(body.themeSong||'').trim()||null;
      const themeArtist=String(body.themeArtist||'').trim()||null;
      const primarySound=String(body.primarySound||'').trim()||null;
      const bio=String(body.bio||'').trim().slice(0,500)||null;
      await sql`INSERT INTO music_profiles(user_id,bio,theme_song_title,theme_song_artist,primary_sound)
        VALUES(${userId},${bio},${themeSong},${themeArtist},${primarySound})
        ON CONFLICT(user_id) DO UPDATE SET bio=EXCLUDED.bio,theme_song_title=EXCLUDED.theme_song_title,theme_song_artist=EXCLUDED.theme_song_artist,primary_sound=EXCLUDED.primary_sound,updated_at=NOW()`;
      return res.status(200).json({ok:true,data:{username,themeSong,themeArtist,primarySound,bio},persistence:'postgresql'});
    }
    res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Method not allowed'});
  }catch(e){
    if(e.code==='DATABASE_NOT_CONFIGURED') return res.status(503).json({error:e.message});
    if(e.code==='23505'||e.message?.includes('duplicate key')) return res.status(409).json({error:'username already exists'});
    return res.status(500).json({error:'Unable to save profile'});
  }
}
