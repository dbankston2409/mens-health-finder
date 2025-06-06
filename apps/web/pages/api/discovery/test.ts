import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log environment variables (without exposing sensitive data)
  console.log('Environment check:', {
    hasGooglePlacesKey: !!process.env.GOOGLE_PLACES_API_KEY,
    hasNextPublicGooglePlacesKey: !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
    hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  });

  // Test direct Google Places API call without auth
  if (req.method === 'GET') {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: 'API key not configured',
          hasGooglePlacesKey: !!process.env.GOOGLE_PLACES_API_KEY,
          hasNextPublicGooglePlacesKey: !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
        });
      }

      // Test with a simple search
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=40.7128,-74.0060&radius=5000&keyword=mens+health&type=health&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      return res.status(200).json({
        success: response.ok,
        status: response.status,
        data: data
      });

    } catch (error) {
      return res.status(500).json({ 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}