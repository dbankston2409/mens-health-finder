import { NextApiRequest, NextApiResponse } from 'next';
import { LRUCache } from 'lru-cache';

// Cache location results for 24 hours to minimize API calls
const locationCache = new LRUCache<string, any>({
  max: 5000, // Cache up to 5000 unique IPs
  ttl: 1000 * 60 * 60 * 24 // 24 hours
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get user's IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || '';
    
    // Handle localhost for development
    if (ip === '::1' || ip === '127.0.0.1' || !ip) {
      return res.json({
        city: 'Dallas',
        state: 'Texas',
        stateCode: 'TX',
        lat: 32.7767,
        lng: -96.7970,
        country: 'US',
        isDefault: true
      });
    }
    
    // Check cache first
    const cached = locationCache.get(ip);
    if (cached) {
      return res.json(cached);
    }
    
    // Call IP geolocation service (ip-api.com - free, no key needed)
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone`);
    const geoData = await geoResponse.json();
    
    // Check if request was successful
    if (geoData.status !== 'success') {
      return res.status(400).json({ 
        error: 'Unable to detect location',
        fallback: true 
      });
    }
    
    // Block non-US users
    if (geoData.countryCode !== 'US') {
      return res.status(403).json({ 
        error: 'Service only available in the United States',
        country: geoData.country,
        countryCode: geoData.countryCode
      });
    }
    
    // Format location data
    const location = {
      city: geoData.city || 'Unknown',
      state: geoData.regionName || 'Unknown',
      stateCode: geoData.region || 'XX',
      lat: geoData.lat || 39.8283,
      lng: geoData.lon || -98.5795,
      country: geoData.countryCode,
      timezone: geoData.timezone
    };
    
    // Cache the result
    locationCache.set(ip, location);
    
    // Set cache headers for browser
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.json(location);
    
  } catch (error) {
    console.error('Location detection error:', error);
    res.status(500).json({ 
      error: 'Location detection failed',
      fallback: true 
    });
  }
}