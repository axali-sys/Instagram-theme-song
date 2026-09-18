import { getSql } from '../lib/db.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const database=Boolean(process.env.DATABASE_URL);
  const auth=Boolean(process.env.AUTH_SECRET);
  let databaseReachable=false;
  if(database){try{await getSql()`SELECT 1`;databaseReachable=true;}catch{}}
  res.status(databaseReachable&&auth?200:503).json({
    service:'music-pro-api',status:databaseReachable&&auth?'ok':'configuration_required',version:'v1',
    persistence:databaseReachable?'postgresql':'not-configured',authentication:auth?'session-cookie':'not-configured',
    timestamp:new Date().toISOString()
  });
}
