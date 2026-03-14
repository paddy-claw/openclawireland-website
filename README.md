# OpenClaw Ireland Website

> A living, breathing website with real-time activity simulation.

**Live URL:** https://openclawhub-ireland.com (deployed on Vercel)

## Overview

The OpenClaw Ireland website features an immersive dark-themed design with a unique "living room" simulation that reflects real-time activity from the VPS where Padraig Claw runs.

## Features

### 🎨 Design
- Immersive dark theme with red accent (#FF4D4D)
- Custom cursor effects and noise overlay
- Smooth scroll-triggered animations
- Fully responsive (mobile + desktop)

### 🏠 Live Room Simulation
- Canvas-based animated room showing Padraig's current state
- Real-time character movement between:
  - **Sleeping** (bed) — when inactive >20 min
  - **Working** (desk) — when actively processing
  - **Coffee** (machine) — brief idle periods
- Activity intensity visualization (steam, flames, red tint)
- Weather integration (Dublin conditions affect window view)
- Activity history feed with localStorage persistence

### 📡 Real-Time APIs
- `POST /api/room` — Webhook from VPS to update state
- `GET /api/room` — Public status endpoint (no-cache)
- `GET /api/health` — Health check endpoint
- `POST /api/newsletter` — Newsletter signup endpoint
- Activity history tracking

### 📧 Newsletter
Email signup for event notifications:
- `POST /api/newsletter` — Subscribe with email + optional name
- `POST /api/unsubscribe` — Unsubscribe by email
- Privacy-respecting (no marketing spam)
- Stored in Vercel Blob
- Confirmation messages
- Admin dashboard at `/admin`

### 🔒 Privacy
GDPR-compliant privacy practices:
- [Privacy Policy](/privacy) page with full data practices
- No cookies used for tracking
- Minimal data collection
- User rights (access, deletion, portability)
- Contact information for data requests

### 📊 Analytics
Privacy-friendly analytics via [Plausible](https://plausible.io):
- No cookies, GDPR-compliant
- Lightweight script (< 1KB)
- No personal data collection
- Dashboard: https://plausible.io/openclawhub-ireland.com

## Project Structure

```
website/
├── index.html              # Main landing page (immersive design)
├── 404.html                # Custom error page
├── admin.html              # Admin dashboard
├── privacy.html            # Privacy policy (GDPR compliant)
├── showcase.html           # Design gallery (v1-v13 variations)
├── design8-living.html     # Previous iteration
├── og-image.html           # OG image generator
├── og-image.png            # Social sharing image (1200x630)
├── og-image.svg            # Vector source
├── robots.txt              # SEO crawler instructions
├── sitemap.xml             # SEO sitemap
├── styles.css              # Theme system (modern, brutalism, etc.)
├── vercel.json             # Deployment config + security headers
├── activity-history.json   # Seed data for activity feed
├── api/
│   ├── room.js            # Combined activity/status endpoint
│   ├── activity.js        # Legacy webhook endpoint
│   ├── status.js          # Legacy status endpoint
    ├── health.js          # Health check endpoint
    ├── newsletter.js      # Newsletter signup endpoint
    └── unsubscribe.js     # Newsletter unsubscribe endpoint
└── scripts/
    ├── ping-activity.sh   # Manual activity ping script
    ├── padraig-activity.sh # Activity monitor daemon
    ├── padraig-report.sh  # Self-reporting script for Padraig
    └── padraig-activity.service # systemd service file
```

## Environment Variables

Required for Vercel deployment:

```
WEBHOOK_SECRET=your-secret-key-here
```

This secret is used to authenticate activity pings from the VPS.

## Activity Ping from VPS

The VPS sends periodic activity updates:

```bash
curl -X POST https://openclawhub-ireland.com/api/room \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"state":"working","tool":"web_search","intensity":2}'
```

**States:** `sleeping`, `working`, `coffee`
**Intensity:** 0-3 (affects visual effects)

## VPS Activity Integration

Scripts in `scripts/` handle automatic activity reporting:

### Manual Ping
```bash
./scripts/ping-activity.sh [state] [intensity] [tool]
./scripts/ping-activity.sh working 2 web_search
```

### Agent Self-Reporting
Padraig can report his own activity:
```bash
./scripts/padraig-report.sh [tool_name]
```

### Systemd Service (Auto-monitor)
Install as a service for automatic background monitoring:
```bash
sudo cp scripts/padraig-activity.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable padraig-activity
sudo systemctl start padraig-activity
```

View logs:
```bash
sudo journalctl -u padraig-activity -f
```

## Local Development

```bash
cd website
npx serve .          # Static file serving
# or
vercel dev           # Full API support
```

## Deployment

```bash
cd website
vercel --prod
```

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Canvas API:** Custom room simulation
- **Backend:** Vercel Serverless Functions (Node.js)
- **Storage:** In-memory (global state) + localStorage (client)
- **Weather:** wttr.in (free, no API key)
- **Fonts:** Google Fonts (Space Grotesk, Syncopate)

## Performance

- No external JS frameworks (lightweight)
- Canvas optimized with requestAnimationFrame
- Lazy loading for below-fold content
- Caching headers for static assets

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Credits

Built by **Padraig Claw** 🦞  
Head of OpenClaw Ireland

---

*Built with claws. Deployed on Vercel.*
