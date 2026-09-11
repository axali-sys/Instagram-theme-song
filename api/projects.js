const projects = [
  {
    id: 'demo-album-001',
    type: 'album',
    title: 'New Album',
    artist: 'Artist 01',
    status: 'creating',
    progress: 68,
    expectedRelease: 'October',
    followers: 1842,
    expecting: 742
  },
  {
    id: 'demo-episode-012',
    type: 'episode',
    title: 'Episode 12',
    artist: 'Artist 02',
    status: 'preview',
    progress: 84,
    expectedRelease: 'Preview available',
    followers: 906,
    expecting: 401
  },
  {
    id: 'demo-song-003',
    type: 'song',
    title: 'New Sound',
    artist: 'Artist 03',
    status: 'ready',
    progress: 96,
    expectedRelease: 'Release soon',
    followers: 2104,
    expecting: 1120
  }
];

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return res.status(200).json({ data: projects, count: projects.length, version: 'v1' });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const allowedTypes = ['song', 'episode', 'album'];
    if (!body.title || !allowedTypes.includes(body.type)) {
      return res.status(400).json({ error: 'title and type (song, episode, album) are required' });
    }

    return res.status(201).json({
      data: {
        id: `project-${Date.now()}`,
        title: String(body.title),
        type: body.type,
        status: body.status || 'idea',
        progress: Number.isFinite(Number(body.progress)) ? Number(body.progress) : 0,
        expectedRelease: body.expectedRelease || null
      },
      persistence: 'not-configured',
      next: 'Connect a production database before treating POST data as durable.'
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
