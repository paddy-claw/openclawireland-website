export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  global.lastActivity = Date.now();
  global.lastTool = req.body.tool || 'unknown';
  res.status(200).json({ success: true, timestamp: global.lastActivity });
}
