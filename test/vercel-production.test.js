import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Vercel production configuration is present', async () => {
  const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(vercel.version, 2);
  assert.equal(vercel.functions['api/**/*.js'].runtime, 'nodejs24.x');
  assert.ok(Array.isArray(vercel.rewrites));
  assert.ok(Array.isArray(vercel.headers));
});

test('production environment template contains required variables', async () => {
  const env = await readFile('.env.example', 'utf8');
  assert.match(env, /DATABASE_URL=/);
  assert.match(env, /AUTH_SECRET=/);
  assert.match(env, /WRONAI_PROTOCOL=/);
});

test('critical production files exist', async () => {
  for (const file of ['index.html','app.js','styles.css','api/health.js','api/auth.js','api/profile.js','api/projects.js','lib/db.js','lib/auth.js','db/schema.sql']) {
    await readFile(file, 'utf8');
  }
});

test('Android/Capacitor configuration is present', async () => {
  const cap = JSON.parse(await readFile('capacitor.config.json', 'utf8'));
  assert.equal(cap.appId, 'com.musicpro.app');
  assert.equal(cap.webDir, 'www');
  assert.match(await readFile('package.json', 'utf8'), /"@capacitor\/android": "\^7\.4\.3"/);
});

test('PWA shell does not cache API responses', async () => {
  const sw = await readFile('sw.js', 'utf8');
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/);
});
