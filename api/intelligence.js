import { readSession } from '../../lib/auth.js';

const MODES = new Set(['discovery','project','audience','profile','moment','release']);

function clean(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function buildPrompt(mode, input) {
  const base = [
    'You are Music Pro Intelligence, an operational AI capability inside Music Pro.',
    'Music Pro remains the product; never present yourself as a separate product or brand.',
    'The listener and creator remain in control. Give useful recommendations and next actions, never make irreversible decisions.',
    'Use only the supplied context. Do not invent listening history, audience numbers, releases, reviews, or artist facts.',
    'Return concise, actionable JSON with keys: summary, insights, nextActions, cautions.',
    'nextActions must be suggestions requiring human approval.'
  ].join(' ');
  const modeText = {
    discovery: 'Help interpret a listener discovery request and suggest relevant directions.',
    project: 'Act as a project companion: interpret project state and identify useful next steps.',
    audience: 'Interpret audience signals and expectations without turning them into a simplistic popularity score.',
    profile: 'Help express a user musical identity without changing it without approval.',
    moment: 'Identify whether the supplied listening context could become a Music Moment.',
    release: 'Act as a release navigator: identify missing release-readiness information and useful next actions.'
  }[mode];
  return base + ' ' + modeText + '\nCONTEXT:\n' + JSON.stringify(input);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ error:'Method not allowed' });
  }
  const userId = await readSession(req);
  if (!userId) return res.status(401).json({ error:'Authentication required' });

  const mode = clean(req.body?.mode, 40);
  if (!MODES.has(mode)) return res.status(400).json({ error:'Unsupported intelligence mode' });

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !apiUrl || !model) {
    return res.status(503).json({
      error:'AI service is not configured',
      required:['AI_API_URL','AI_API_KEY','AI_MODEL']
    });
  }

  const prompt = buildPrompt(mode, req.body?.input ?? {});
  try {
    const upstream = await fetch(apiUrl, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({
        model,
        messages:[
          {role:'system',content:'Return valid JSON only.'},
          {role:'user',content:prompt}
        ],
        temperature:0.2,
        response_format:{type:'json_object'}
      })
    });
    const raw = await upstream.text();
    if (!upstream.ok) return res.status(502).json({error:'AI provider request failed',status:upstream.status});
    let payload;
    try { payload = JSON.parse(raw); } catch { return res.status(502).json({error:'AI provider returned invalid JSON'}); }
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({error:'AI provider returned no content'});
    let result;
    try { result = JSON.parse(content); } catch { return res.status(502).json({error:'AI provider returned non-JSON content'}); }
    return res.status(200).json({ok:true,mode,result});
  } catch {
    return res.status(502).json({error:'Unable to reach AI provider'});
  }
}
