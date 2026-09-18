import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE='music_pro_session';
function secret(){ return new TextEncoder().encode(process.env.AUTH_SECRET || ''); }
export function authConfigured(){ return Boolean(process.env.AUTH_SECRET); }
export function hashPassword(password, salt=randomBytes(16).toString('hex')){
  return {salt, hash:scryptSync(password,salt,64).toString('hex')};
}
export function verifyPassword(password,salt,hash){
  const actual=scryptSync(password,salt,64);
  const expected=Buffer.from(hash,'hex');
  return expected.length===actual.length && timingSafeEqual(actual,expected);
}
export async function issueSession(userId){
  if(!authConfigured()) throw Object.assign(new Error('AUTH_SECRET is not configured'),{code:'AUTH_NOT_CONFIGURED'});
  return new SignJWT({sub:userId}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('30d').sign(secret());
}
export async function readSession(req){
  const raw=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));
  if(!raw || !authConfigured()) return null;
  try{return (await jwtVerify(decodeURIComponent(raw.slice(COOKIE.length+1)),secret())).payload.sub || null;}catch{return null;}
}
export function setSession(res,token){
  res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
}
export function clearSession(res){
  res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
export function publicUser(row){
  if(!row) return null;
  return {id:row.id,email:row.email,username:row.username,createdAt:row.created_at};
}
export function emailKey(email){ return createHash('sha256').update(email.trim().toLowerCase()).digest('hex'); }
