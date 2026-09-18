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
