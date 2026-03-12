// ===== ROOM SIMULATION - Vercel API Version =====
const canvas = document.getElementById('roomCanvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('statusText');
const activityValue = document.getElementById('activityValue');
const dublinTime = document.getElementById('dublinTime');
const sessionTime = document.getElementById('sessionTime');

// Room state (from server)
let currentState = 'sleeping';
let serverState = null;
let lastFetch = 0;

// Animation state
let characterPos = { x: 110, y: 300 };
let targetPos = { x: 110, y: 300 };
let walkCycle = 0;
let isWalking = false;
let monitorGlow = 0;
let windowLight = 0.3;
let typingAnimation = 0;

const STATE_POSITIONS = {
  sleeping: { x: 110, y: 300 },
  working: { x: 510, y: 250 },
  coffee: { x: 690, y: 180 }
};

// Fetch status from Vercel API
async function fetchStatus() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('Failed to fetch');
    serverState = await response.json();
    lastFetch = Date.now();
    
    // Update state if changed
    if (serverState.state !== currentState) {
      currentState = serverState.state;
      targetPos = STATE_POSITIONS[currentState];
      isWalking = true;
    }
    
    // Update UI
    updateUI();
  } catch (err) {
    console.log('Status fetch failed:', err);
  }
}

function updateUI() {
  if (!serverState) return;
  
  const stateLabels = {
    sleeping: { text: 'Sleeping', status: 'Offline — Recharging' },
    working: { text: 'Active at Desk', status: 'Online — Processing' },
    coffee: { text: 'Coffee Break ☕', status: 'Idle — Grabbing Coffee' }
  };
  
  const label = stateLabels[currentState];
  activityValue.textContent = label.text;
  statusText.textContent = label.status;
  dublinTime.textContent = serverState.dublinTime;
  
  const sessionMins = Math.floor((Date.now() - (serverState.lastActive || Date.now())) / 60000);
  sessionTime.textContent = sessionMins < 60 ? sessionMins + 'm' : Math.floor(sessionMins/60) + 'h ' + (sessionMins%60) + 'm';
}

// Drawing functions
function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawWindow(x, y, w, h, lightLevel) {
  drawRect(x, y, w, h, '#1a1a2e');
  const skyColor = lightLevel > 0.5 ? '#87CEEB' : '#0a0a20';
  const moonSunColor = lightLevel > 0.5 ? '#FFD700' : '#F0F0F0';
  drawRect(x + 5, y + 5, w - 10, h - 10, skyColor);
  if (lightLevel > 0.5) {
    drawCircle(x + w - 30, y + 30, 15, moonSunColor);
  } else {
    drawCircle(x + w - 30, y + 30, 12, moonSunColor);
    drawCircle(x + w - 35, y + 25, 3, '#0a0a20');
  }
  ctx.strokeStyle = '#2a2a3e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w/2, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.moveTo(x, y + h/2);
  ctx.lineTo(x + w, y + h/2);
  ctx.stroke();
}

function drawBed(x, y, w, h) {
  drawRect(x, y + h - 20, w, 20, '#3d2817');
  drawRect(x, y, 10, h, '#3d2817');
  drawRect(x + w - 10, y, 10, h, '#3d2817');
  drawRect(x + 10, y + 30, w - 20, h - 40, '#e8e0d0');
  drawRect(x + 15, y + 35, 30, 15, '#ffffff');
  drawRect(x + 10, y + 55, w - 20, h - 65, '#5a4a3a');
  drawRect(x + 10, y + 70, w - 20, 3, '#4a3a2a');
  drawRect(x + 10, y + 85, w - 20, 3, '#4a3a2a');
}

function drawDesk(x, y, w, h) {
  drawRect(x, y, w, 10, '#4a3a2a');
  drawRect(x + 5, y + 10, 8, h - 10, '#3d2a1a');
  drawRect(x + w - 13, y + 10, 8, h - 10, '#3d2a1a');
  drawRect(x + 30, y - 40, 60, 40, '#1a1a2e');
  drawRect(x + 35, y - 35, 50, 30, '#0a0a12');
  drawRect(x + 55, y - 10, 10, 10, '#2a2a3e');
  
  if (monitorGlow > 0) {
    ctx.fillStyle = `rgba(0, 212, 170, ${monitorGlow * 0.3})`;
    ctx.fillRect(x + 35, y - 35, 50, 30);
    ctx.fillStyle = `rgba(0, 212, 170, ${monitorGlow})`;
    ctx.fillRect(x + 40, y - 30, 20, 2);
    ctx.fillRect(x + 40, y - 25, 35, 2);
    ctx.fillRect(x + 40, y - 20, 25, 2);
  }
  
  drawRect(x + 25, y + 5, 50, 5, '#2a2a3e');
  drawRect(x + w/2 - 15, y + 15, 30, 5, '#2a2a3e');
  drawRect(x + w/2 - 5, y + 20, 10, 40, '#2a2a3e');
  drawRect(x + w/2 - 15, y + 55, 30, 5, '#2a2a3e');
}

function drawCoffeeMachine(x, y, w, h) {
  drawRect(x, y, w, h, '#2a2a3e');
  drawRect(x + 5, y + 5, w - 10, h - 10, '#1a1a2e');
  drawRect(x + 10, y + 10, w - 20, 15, '#0a0a12');
  ctx.fillStyle = '#00d4aa';
  ctx.font = '10px monospace';
  ctx.fillText('READY', x + 15, y + 22);
  drawRect(x + 15, y + 35, 15, 12, '#ffffff');
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x + 18, y + 38, 9, 6);
  const steamOffset = Math.sin(Date.now() / 500) * 3;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x + 20 + steamOffset, y + 30, 3, 5);
  ctx.fillRect(x + 25 - steamOffset, y + 25, 3, 5);
}

function drawPlant(x, y, w, h) {
  drawRect(x + w/4, y + h/2, w/2, h/2, '#8b4513');
  drawCircle(x + w/2, y + h/3, 12, '#2d5a27');
  drawCircle(x + w/3, y + h/4, 10, '#3d7a37');
  drawCircle(x + 2*w/3, y + h/4, 10, '#3d7a37');
  drawCircle(x + w/2, y + h/6, 8, '#4d9a47');
}

function drawShelf(x, y, w, h) {
  drawRect(x, y + h - 5, w, 5, '#4a3a2a');
  drawRect(x, y, 5, h, '#4a3a2a');
  drawRect(x + w - 5, y, 5, h, '#4a3a2a');
  drawRect(x + 10, y + 10, 8, h - 15, '#8b0000');
  drawRect(x + 20, y + 15, 8, h - 20, '#006b3c');
  drawRect(x + 30, y + 5, 8, h - 10, '#00008b');
  drawCircle(x + 55, y + h - 15, 8, '#2d5a27');
  drawCircle(x + 50, y + h - 20, 6, '#3d7a37');
}

function drawCharacter(x, y, state, walkFrame) {
  const bounce = isWalking ? Math.sin(walkFrame * 0.5) * 3 : 0;
  
  if (state === 'sleeping') {
    drawRect(x - 20, y + 10, 40, 15, '#00d4aa');
    drawCircle(x - 25, y + 17, 10, '#ffdbac');
    const zOffset = (Date.now() / 1000) % 3;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 - zOffset/6})`;
    ctx.font = '12px monospace';
    ctx.fillText('Z', x - 35, y - zOffset * 5);
    if (zOffset > 1) ctx.fillText('Z', x - 30, y - (zOffset - 1) * 5);
    if (zOffset > 2) ctx.fillText('Z', x - 25, y - (zOffset - 2) * 5);
  } else {
    const yPos = y + bounce;
    drawRect(x - 10, yPos, 20, 25, '#00d4aa');
    drawCircle(x, yPos - 8, 10, '#ffdbac');
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 4, yPos - 10, 2, 2);
    ctx.fillRect(x + 2, yPos - 10, 2, 2);
    
    if (state === 'working') {
      // Typing animation
      const typeOffset = Math.sin(typingAnimation) * 3;
      drawRect(x + 8, yPos + 5 + typeOffset, 12, 4, '#ffdbac');
      drawRect(x - 12, yPos + 5 - typeOffset, 4, 12, '#ffdbac');
    } else if (state === 'coffee') {
      drawRect(x + 5, yPos + 5, 12, 4, '#ffdbac');
      drawRect(x + 15, yPos + 3, 6, 8, '#ffffff');
    } else if (isWalking) {
      const armOffset = Math.sin(walkFrame * 0.5) * 5;
      drawRect(x - 5, yPos + 5 + armOffset, 4, 12, '#ffdbac');
      drawRect(x + 1, yPos + 5 - armOffset, 4, 12, '#ffdbac');
    } else {
      drawRect(x - 12, yPos + 5, 4, 12, '#ffdbac');
      drawRect(x + 8, yPos + 5, 4, 12, '#ffdbac');
    }
    
    if (isWalking) {
      const legOffset = Math.sin(walkFrame * 0.5) * 8;
      drawRect(x - 6, yPos + 25, 5, 12 + legOffset, '#2a2a3e');
      drawRect(x + 1, yPos + 25, 5, 12 - legOffset, '#2a2a3e');
    } else {
      drawRect(x - 6, yPos + 25, 5, 12, '#2a2a3e');
      drawRect(x + 1, yPos + 25, 5, 12, '#2a2a3e');
    }
  }
}

function drawRoom() {
  drawRect(0, 0, 800, 500, '#0a0a12');
  drawRect(0, 350, 800, 150, '#151520');
  ctx.strokeStyle = '#1a1a28';
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 350);
    ctx.lineTo(i, 500);
    ctx.stroke();
  }
  drawRect(300, 360, 200, 80, '#2a1a1a');
  ctx.strokeStyle = '#3a2a2a';
  ctx.lineWidth = 2;
  ctx.strokeRect(305, 365, 190, 70);
  drawWindow(230, 50, 160, 110, windowLight);
  drawBed(60, 260, 140, 100);
  drawDesk(450, 220, 160, 100);
  drawCoffeeMachine(680, 140, 70, 50);
  drawPlant(40, 140, 50, 80);
  drawShelf(650, 60, 100, 60);
  drawCharacter(characterPos.x, characterPos.y, currentState, walkCycle);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(10, 10, 150, 30);
  ctx.fillStyle = currentState === 'sleeping' ? '#7c60ff' : currentState === 'working' ? '#00d4aa' : '#ff8c42';
  ctx.font = '12px monospace';
  ctx.fillText('● ' + currentState.toUpperCase(), 20, 30);
}

function updatePosition() {
  if (!isWalking) return;
  const dx = targetPos.x - characterPos.x;
  const dy = targetPos.y - characterPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 2) {
    characterPos.x = targetPos.x;
    characterPos.y = targetPos.y;
    isWalking = false;
    walkCycle = 0;
    return;
  }
  const speed = 2;
  characterPos.x += (dx / distance) * speed;
  characterPos.y += (dy / distance) * speed;
  walkCycle += 0.3;
}

function updateVisuals() {
  const hour = new Date().getHours();
  windowLight = (hour >= 6 && hour < 18) ? 0.8 : 0.2;
  
  if (currentState === 'working') {
    monitorGlow = 0.5 + Math.sin(Date.now() / 500) * 0.3;
    typingAnimation += 0.5;
  } else {
    monitorGlow = Math.max(0, monitorGlow - 0.02);
  }
}

function animate() {
  updatePosition();
  updateVisuals();
  drawRoom();
  requestAnimationFrame(animate);
}

// Poll status every 30 seconds
fetchStatus();
setInterval(fetchStatus, 30000);

// Start animation
animate();
