// POST /api/activity - Webhook from Padraig's VPS
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify secret token
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Store timestamp (using global for simple in-memory storage)
  global.lastActivity = Date.now();
  global.lastTool = req.body.tool || 'unknown';
  
  res.status(200).json({ 
    success: true, 
    timestamp: global.lastActivity 
  });
}
