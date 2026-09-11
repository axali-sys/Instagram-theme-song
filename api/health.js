export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    service: 'music-pro-api',
    status: 'ok',
    version: 'v1',
    mode: 'live-api-foundation',
    persistence: 'not-configured',
    timestamp: new Date().toISOString()
  });
}
