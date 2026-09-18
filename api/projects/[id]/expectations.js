import { requireSql } from '../../../lib/db.js';
import { readSession } from '../../../lib/auth.js';

const ALLOWED = new Set([
  'release_date',
  'new_episode',
  'full_album',
  'new_sound',
  'collaboration',
  'story_continuation'
]);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'Project id is required' });

  try {
    const sql = requireSql();

    if (req.method === 'GET') {
      const userId = await readSession(req);
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      const rows = await sql`
        SELECT expectations
        FROM project_followers
        WHERE project_id = ${id} AND user_id = ${userId}
      `;

      return res.status(200).json({
        data: { projectId: id, expectations: rows[0]?.expectations || [] },
        version: 'v1',
        persistence: 'postgresql'
      });
    }

    if (req.method === 'POST') {
      const userId = await readSession(req);
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      const raw = req.body?.expectations;
      if (!Array.isArray(raw)) {
        return res.status(400).json({ error: 'expectations must be an array' });
      }

      const expectations = [...new Set(raw.map((value) => String(value).trim()).filter(Boolean))];
      const invalid = expectations.filter((value) => !ALLOWED.has(value));
      if (invalid.length) {
        return res.status(400).json({ error: 'unsupported expectation', invalid });
      }

      await sql`
        INSERT INTO project_followers(project_id, user_id, expectations, expecting)
        VALUES(${id}, ${userId}, ${expectations}, ${expectations.length > 0})
        ON CONFLICT(project_id, user_id)
        DO UPDATE SET expectations = EXCLUDED.expectations,
                      expecting = EXCLUDED.expecting
      `;

      return res.status(200).json({
        ok: true,
        projectId: id,
        expectations,
        persistence: 'postgresql'
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    if (e.code === 'DATABASE_NOT_CONFIGURED') {
      return res.status(503).json({ error: e.message });
    }
    if (e.code === '22P02') {
      return res.status(400).json({ error: 'invalid project id' });
    }
    return res.status(500).json({ error: 'Unable to process project expectations' });
  }
}
