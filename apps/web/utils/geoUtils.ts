/**
 * Utility functions for geographic operations
 */

/**
 * Calculate distance between two points using the Haversine formula
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Prompt the user for their location
 * 
 * @returns Promise resolving to coordinates or null if denied
 */
export async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get city and state
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise resolving to location info or null if failed
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string; state: string; country: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'User-Agent': 'MensHealthFinder/1.0' } }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }
    
    // Extract address components
    const address = data.address;
    const city = address.city || address.town || address.village || address.hamlet || address.suburb;
    const state = address.state_code || address.state;
    const country = address.country_code?.toUpperCase() || address.country;
    
    if (!city || !state) {
      return null;
    }
    
    return { city, state, country };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Forward geocode a location string to coordinates
 * 
 * @param locationString - Location in "City, State" format
 * @returns Promise resolving to coordinates or null if failed
 */
export async function geocodeLocation(
  locationString: string
): Promise<{ lat: number; lng: number; zoom: number } | null> {
  try {
    // Parse city and state from the location string
    const parts = locationString.split(',');
    if (parts.length < 2) return null;
    
    const city = parts[0].trim();
    const state = parts[1].trim();
    
    if (!city || !state) return null;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&countrycodes=us&limit=1`,
      { headers: { 'User-Agent': 'MensHealthFinder/1.0' } }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.length) {
      return null;
    }
    
    const result = data[0];
    
    // Determine zoom level based on result type
    let zoom = 12; // Default for cities
    
    if (result.type === 'state' || result.type === 'administrative') {
      zoom = 7;
    } else if (result.type === 'county') {
      zoom = 9;
    } else if (result.type === 'neighbourhood' || result.type === 'suburb') {
      zoom = 14;
    }
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      zoom
    };
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
  }
}

/**
 * Save user's location to browser storage
 * 
 * @param location - Location object to save
 */
export function saveUserLocation(location: { lat: number; lng: number; city?: string; state?: string }): void {
  try {
    sessionStorage.setItem('userLocation', JSON.stringify(location));
    localStorage.setItem('hasLocationPermission', 'true');
  } catch (error) {
    console.error('Error saving user location:', error);
  }
}

/**
 * Get user's saved location from browser storage
 * 
 * @returns Saved location or null if not found
 */
export function getSavedLocation(): { lat: number; lng: number; city?: string; state?: string } | null {
  try {
    const savedLocation = sessionStorage.getItem('userLocation');
    if (!savedLocation) return null;
    
    return JSON.parse(savedLocation);
  } catch (error) {
    console.error('Error getting saved location:', error);
    return null;
  }
}