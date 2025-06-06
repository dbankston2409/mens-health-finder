import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated and is admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user is admin (you may want to check custom claims or database)
    if (!decodedToken.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get search parameters from request body
    const { location, radius, keyword, type = 'health' } = req.body;

    if (!location || !radius || !keyword) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get Google Places API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    // Build the Google Places API URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.append('location', location);
    url.searchParams.append('radius', radius.toString());
    url.searchParams.append('keyword', keyword);
    url.searchParams.append('type', type);
    url.searchParams.append('key', apiKey);

    // Make the request to Google Places API
    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return res.status(response.status).json({ error: data.error_message || 'Google Places API error' });
    }

    // Return the results
    res.status(200).json(data);

  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}