// POST /api/newsletter - Newsletter signup endpoint
// Stores email addresses for event notifications
// Uses Vercel Blob for persistence (serverless-friendly)

import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name = '' } = req.body || {};

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address',
        message: 'Please provide a valid email address'
      });
    }

    // Check if already subscribed
    const existing = await findSubscriber(email);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed!',
        alreadySubscribed: true
      });
    }

    // Create subscriber entry
    const subscriber = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      subscribedAt: new Date().toISOString(),
      source: req.headers.referer || 'openclawhub-ireland.com',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    // Store in Vercel Blob
    const blobName = `subscribers/${Date.now()}_${sanitizeEmail(email)}.json`;
    await put(blobName, JSON.stringify(subscriber), {
      contentType: 'application/json',
      access: 'private'
    });

    // Return success
    return res.status(201).json({
      success: true,
      message: 'Welcome to OpenClaw Ireland! You will receive updates about upcoming events.',
      subscriber: {
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt
      }
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to process signup. Please try again later.'
    });
  }
}

// GET endpoint to retrieve subscriber count (admin use)
export async function getSubscriberStats(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check - could be enhanced with proper API key validation
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { blobs } = await list({ prefix: 'subscribers/' });
    
    return res.status(200).json({
      totalSubscribers: blobs.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve stats' });
  }
}

// Helper: Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper: Sanitize email for use in filename
function sanitizeEmail(email) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Helper: Check if subscriber already exists
async function findSubscriber(email) {
  try {
    const { blobs } = await list({ prefix: 'subscribers/' });
    const normalizedEmail = email.toLowerCase().trim();
    
    for (const blob of blobs) {
      // Simple check - in production, you might want to download and check content
      if (blob.pathname.includes(sanitizeEmail(normalizedEmail))) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking existing subscriber:', error);
    return false;
  }
}
