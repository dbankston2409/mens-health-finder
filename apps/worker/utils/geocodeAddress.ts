import fetch from 'node-fetch';
import { GeocodeResult } from '../types/clinic';

export async function geocodeAddress(address: string, city?: string, state?: string, zip?: string): Promise<GeocodeResult> {
  // Build full address string
  const fullAddress = buildFullAddress(address, city, state, zip);
  
  if (!fullAddress) {
    return {
      lat: 0,
      lng: 0,
      geoAccuracy: 'failed'
    };
  }
  
  // Try Google Maps API first if available
  if (process.env.GEOCODE_API_KEY) {
    try {
      return await geocodeWithGoogle(fullAddress);
    } catch (error) {
      console.warn('Google geocoding failed, falling back to Nominatim:', error);
    }
  }
  
  // Fallback to Nominatim (free)
  try {
    return await geocodeWithNominatim(fullAddress);
  } catch (error) {
    console.error('Geocoding failed for address:', fullAddress, error);
    return {
      lat: 0,
      lng: 0,
      geoAccuracy: 'failed'
    };
  }
}

async function geocodeWithGoogle(address: string): Promise<GeocodeResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GEOCODE_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json() as any;
  
  if (data.status === 'OK' && data.results && data.results.length > 0) {
    const result = data.results[0];
    const location = result.geometry.location;
    
    // Determine accuracy based on Google's location_type
    let accuracy: 'exact' | 'approximate' | 'failed' = 'approximate';
    if (result.geometry.location_type === 'ROOFTOP') {
      accuracy = 'exact';
    } else if (result.geometry.location_type === 'RANGE_INTERPOLATED') {
      accuracy = 'approximate';
    }
    
    return {
      lat: location.lat,
      lng: location.lng,
      geoAccuracy: accuracy
    };
  }
  
  throw new Error(`Google geocoding failed: ${data.status}`);
}

async function geocodeWithNominatim(address: string): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MensHealthFinder/1.0'
    }
  });
  
  const data = await response.json() as any[];
  
  if (data && data.length > 0) {
    const result = data[0];
    
    // Determine accuracy based on Nominatim's class and type
    let accuracy: 'exact' | 'approximate' | 'failed' = 'approximate';
    if (result.class === 'building' || result.type === 'house') {
      accuracy = 'exact';
    } else if (result.class === 'place' && ['city', 'town', 'village'].includes(result.type)) {
      accuracy = 'approximate';
    }
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      geoAccuracy: accuracy
    };
  }
  
  throw new Error('Nominatim geocoding returned no results');
}

function buildFullAddress(address: string, city?: string, state?: string, zip?: string): string {
  const parts = [address, city, state, zip].filter(part => part && part.trim() !== '');
  return parts.join(', ');
}

// Add a small delay to respect rate limits
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}