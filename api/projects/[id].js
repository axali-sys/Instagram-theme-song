const projects = {
  'demo-album-001': {
    id: 'demo-album-001', type: 'album', title: 'New Album', artist: 'Artist 01', status: 'creating', progress: 68,
    expectedRelease: 'October', milestones: ['Announced', 'Cover revealed', 'Preview released', 'Final production', 'Release']
  },
  'demo-episode-012': {
    id: 'demo-episode-012', type: 'episode', title: 'Episode 12', artist: 'Artist 02', status: 'preview', progress: 84,
    expectedRelease: 'Preview available', milestones: ['Recorded', 'Edited', 'Preview', 'Release']
  },
  'demo-song-003': {
    id: 'demo-song-003', type: 'song', title: 'New Sound', artist: 'Artist 03', status: 'ready', progress: 96,
    expectedRelease: 'Release soon', milestones: ['Announced', 'Preview', 'Final production', 'Release']
  }
};

export default function handler(req, res) {
  const id = req.query?.id;
  const project = projects[id];
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.status(200).json({ data: project, version: 'v1', persistence: 'not-configured' });
  }

  if (req.method === 'POST') {
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const action = req.body?.action;
    const allowed = ['follow', 'unfollow', 'expect', 'unexpect', 'save', 'unsave'];
    if (!allowed.includes(action)) return res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    return res.status(200).json({ projectId: id, action, accepted: true, persistence: 'not-configured' });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
