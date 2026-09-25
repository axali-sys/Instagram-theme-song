import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const apiFiles=['api/moments.js','api/playlists.js','api/favorites.js','api/listening.js','api/discovery.js'];
const sourceFiles=['api/auth.js','api/intelligence.js','api/project-actions.js','lib/rate-limit.js','app.js'];

test('V1 listener APIs are syntactically valid',()=>{
  for(const file of [...apiFiles,...sourceFiles]) execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
});

test('V1 listener persistence schema is present',async()=>{
  const schema=await readFile('db/schema.sql','utf8');
  for(const table of ['music_moments','playlists','playlist_items','favorites','listening_activity','project_likes']) assert.match(schema,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
});

test('listener home has all four V1 surfaces',async()=>{
  const html=await readFile('index.html','utf8');
  for(const value of ['for-you','coming-soon','people','moments']) assert.match(html,new RegExp('data-listener-tab="'+value+'"'));
  assert.match(html,/id="forYouFeed"/);
  assert.match(html,/id="comingSoonList"/);
  assert.match(html,/id="peopleLikeMeList"/);
  assert.match(html,/id="momentSummary"/);
});

test('service worker never caches API responses',async()=>{
  const sw=await readFile('sw.js','utf8');
  assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
});

test('production docs require human approval',async()=>{
  const readme=await readFile('README.md','utf8');
  assert.match(readme,/Production deployment requires human approval/);
});
