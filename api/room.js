// Combined endpoint - handles both POST (activity) and GET (status)
export default function handler(req, res) {
  // POST /api/room - Receive activity ping from VPS
  if (req.method === 'POST') {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    global.lastActivity = Date.now();
    global.lastTool = req.body.tool || 'unknown';
    return res.status(200).json({ success: true, timestamp: global.lastActivity });
  }

  // GET /api/room - Check current status
  if (req.method === 'GET') {
    const now = Date.now();
    const lastActive = global.lastActivity || 0;
    const inactiveTime = now - lastActive;
    
    let state = 'sleeping';
    if (inactiveTime < 2 * 60 * 1000) {
      state = 'working';
    } else if (inactiveTime < 20 * 60 * 1000) {
      state = 'coffee';
    }

    return res.status(200).json({
      state,
      lastActive,
      inactiveTime,
      lastTool: global.lastTool || 'none',
      dublinTime: new Date().toLocaleTimeString('en-IE', { 
        timeZone: 'Europe/Dublin',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
