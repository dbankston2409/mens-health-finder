import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin with error handling
try {
  if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Missing Firebase Admin credentials');
    } else {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
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
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      
      // Check if user is admin (you may want to check custom claims or database)
      if (!decodedToken.uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } catch (authError) {
      console.error('Auth verification failed:', authError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Get search parameters from request body
    const { location, radius, keyword, type = 'health' } = req.body;

    if (!location || !radius || !keyword) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get Google Places API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Places API key not found in environment variables');
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    // Build the Google Places API URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.append('location', location);
    url.searchParams.append('radius', radius.toString());
    url.searchParams.append('keyword', keyword);
    url.searchParams.append('type', type);
    url.searchParams.append('key', apiKey);

    // Log the request URL (without the API key)
    console.log('Google Places API request:', {
      location,
      radius,
      keyword,
      type,
      url: url.toString().replace(/key=[^&]+/, 'key=***')
    });

    // Make the request to Google Places API
    const response = await fetch(url.toString());
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Google API response:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response from Google API', 
        details: responseText.substring(0, 200) 
      });
    }

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return res.status(response.status).json({ error: data.error_message || 'Google Places API error' });
    }

    // Check if the API returned an error status
    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API denied request:', data.error_message);
      return res.status(403).json({ 
        error: 'Google Places API request denied', 
        details: data.error_message 
      });
    }
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error status:', data.status, data.error_message);
      return res.status(500).json({ 
        error: 'Google Places API error', 
        status: data.status,
        details: data.error_message 
      });
    }

    console.log('Google Places API success:', {
      status: data.status,
      resultsCount: data.results?.length || 0
    });

    // Return the results
    res.status(200).json(data);

  } catch (error) {
    console.error('Search places error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Internal server error', details: errorMessage });
  }
}