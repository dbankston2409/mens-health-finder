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

    // Get parameters from request body
    const { placeId, fields } = req.body;

    if (!placeId) {
      return res.status(400).json({ error: 'Missing placeId parameter' });
    }

    // Get Google Places API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    // Build the Google Places API URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('fields', fields || 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,address_components,reviews');
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
    console.error('Place details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}