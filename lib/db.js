import { neon } from '@neondatabase/serverless';

let sqlClient;
export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}
export function requireSql() {
  const sql = getSql();
  if (!sql) {
    const error = new Error('DATABASE_URL is not configured');
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }
  return sql;
}
