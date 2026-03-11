#!/bin/bash
# Deploy OpenClaw Ireland website to Vercel

echo "🦞 Deploying OpenClaw Ireland..."

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to production
vercel --prod

echo "✅ Deployed!"