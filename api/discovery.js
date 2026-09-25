import { requireSql } from '../lib/db.js';
import { readSession } from '../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
  if(req.method!=='GET') {res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
  try{
    const sql=requireSql(); const userId=await readSession(req);
    if(!userId)return res.status(401).json({error:'Authentication required'});
    const profile=await sql`SELECT primary_sound FROM music_profiles WHERE user_id=${userId}`;
    const sound=profile[0]?.primary_sound||null;
    const projects=await sql`SELECT p.id,p.type,p.title,p.status,p.progress,p.expected_release,u.username AS artist
      FROM music_projects p JOIN users u ON u.id=p.creator_id ORDER BY p.created_at DESC LIMIT 20`;
    const coming=await sql`SELECT p.id,p.type,p.title,p.status,p.progress,p.expected_release,u.username AS artist
      FROM music_projects p JOIN project_followers f ON f.project_id=p.id JOIN users u ON u.id=p.creator_id
      WHERE f.user_id=${userId} AND (f.expecting=true OR p.expected_release IS NOT NULL)
      ORDER BY COALESCE(p.expected_release,p.created_at) ASC LIMIT 20`;
    const people=sound?await sql`SELECT u.username,mp.display_name,mp.primary_sound FROM music_profiles mp JOIN users u ON u.id=mp.user_id
      WHERE mp.primary_sound=${sound} AND u.id<>${userId} ORDER BY mp.updated_at DESC LIMIT 20`: [];
    const moments=await sql`SELECT id,song_title,artist,body,visibility,created_at FROM music_moments WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 20`;
    return res.status(200).json({data:{forYou:projects,comingSoon:coming,peopleLikeMe:people,moments},context:{declaredSound:sound},persistence:'postgresql'});
  }catch(e){if(e.code==='DATABASE_NOT_CONFIGURED')return res.status(503).json({error:e.message});return res.status(500).json({error:'Unable to load listener discovery'});}
}
