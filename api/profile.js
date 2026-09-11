export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return res.status(200).json({
      data: {
        username: 'yourprofile',
        themeSong: 'Golden Hour',
        primarySound: 'Afrobeats',
        followers: 24,
        artists: 8,
        playlists: 3
      },
      version: 'v1',
      persistence: 'not-configured'
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const username = String(body.username || '').trim().replace(/^@/, '');
    if (!username) return res.status(400).json({ error: 'username is required' });

    return res.status(200).json({
      data: {
        username,
        themeSong: body.themeSong || 'Golden Hour',
        primarySound: body.primarySound || 'Afrobeats'
      },
      persistence: 'not-configured',
      next: 'Connect authentication and a production database before treating profile writes as durable.'
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
