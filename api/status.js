// GET /api/status - Public endpoint for room status
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  const lastActive = global.lastActivity || 0;
  const inactiveTime = now - lastActive;
  
  // Determine state based on inactivity
  let state = 'sleeping';
  if (inactiveTime < 2 * 60 * 1000) {
    state = 'working';
  } else if (inactiveTime < 20 * 60 * 1000) {
    state = 'coffee';
  }

  res.status(200).json({
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
