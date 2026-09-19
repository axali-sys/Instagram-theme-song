import test from 'node:test';
import assert from 'node:assert/strict';
test('Music Pro production modules are present', async ()=>{
  const db=await import('../lib/db.js');
  const auth=await import('../lib/auth.js');
  assert.equal(typeof db.getSql,'function');
  assert.equal(typeof auth.issueSession,'function');
  assert.equal(typeof auth.hashPassword,'function');
});
test('password hashing verifies and rejects changes', async ()=>{
  const {hashPassword,verifyPassword}=await import('../lib/auth.js');
  const p=hashPassword('MusicPro-test-123');
  assert.equal(verifyPassword('MusicPro-test-123',p.salt,p.hash),true);
  assert.equal(verifyPassword('wrong',p.salt,p.hash),false);
});
test('Music Pro intelligence endpoint is consolidated and present', async ()=>{
  const fs=await import('node:fs/promises');
  const source=await fs.readFile(new URL('../api/intelligence.js',import.meta.url),'utf8');
  assert.match(source,/Music Pro Intelligence/);
  assert.match(source,/AI_API_KEY/);
  assert.match(source,/nextActions/);
  assert.match(source,/approval_required/);
});
test('Music Pro serverless function consolidation is present', async ()=>{
  const fs=await import('node:fs/promises');
  const [auth,project,notifications,vercel]=await Promise.all([
    fs.readFile(new URL('../api/auth.js',import.meta.url),'utf8'),
    fs.readFile(new URL('../api/project-actions.js',import.meta.url),'utf8'),
    fs.readFile(new URL('../api/notifications.js',import.meta.url),'utf8'),
    fs.readFile(new URL('../vercel.json',import.meta.url),'utf8')
  ]);
  assert.match(auth,/register/);assert.match(auth,/login/);assert.match(auth,/logout/);assert.match(auth,/readSession/);
  assert.match(project,/evaluate/);assert.match(project,/expectations/);assert.match(project,/milestones/);assert.match(project,/updates/);
  assert.match(notifications,/preferences/);
  assert.match(vercel,/project-actions/);
});
