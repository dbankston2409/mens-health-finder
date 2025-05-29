import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
// Import and initialize libraries on the client side only
// Simplified approach to avoid race conditions
let nominatim: any = null;
let L: any = null;

// We'll dynamically import all CSS in useEffect to avoid build issues

// This will run in the browser, but not during server-side rendering
if (typeof window !== 'undefined') {
  // We'll initialize these in useEffect within the component to ensure proper timing
  // This just sets up the imports to be used later
  import('nominatim-browser').then(mod => {
    nominatim = mod.default;
    console.log("Nominatim library import successful");
  }).catch(err => {
    console.error("Failed to import nominatim library:", err);
  });
  
  import('leaflet').then(mod => {
    L = mod;
    // Handle CSS in a different way - Next.js will handle these automatically at build time
    // The CSS will be included in the build output
    console.log("Leaflet import successful");
    
    // Load compatibility module for icons
    import('leaflet-defaulticon-compatibility').catch(err => 
      console.error("Error importing leaflet compatibility:", err)
    );
  }).catch(err => {
    console.error("Error importing Leaflet:", err);
  });
}

// We'll dynamically load map components in the component's useEffect
// This ensures all imports happen client-side only

// Interface definitions moved to MapComponentsWrapper.tsx

interface ClinicLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  tier: 'free' | 'standard' | 'advanced';
  rating?: number;
  phone?: string;
  services?: string[];
}

// Map bounds and center components are now dynamically imported through MapComponentsWrapper

interface MapProps {
  locations: ClinicLocation[];
  center?: { lat: number; lng: number; zoom: number };
  singleLocation?: boolean;
  height?: string;
  defaultToUS?: boolean; // Flag to always default to US view if true
}

const Map: React.FC<MapProps> = ({ 
  locations, 
  center,
  singleLocation = false,
  height = '500px',
  defaultToUS = false
}) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Default center is the US
  const defaultCenter = { lat: 39.8283, lng: -98.5795, zoom: 4 }; 
  
  // Get user's location when component mounts
  useEffect(() => {
    // Skip if we're in server-side rendering
    if (typeof window === 'undefined') return;
    
    // Skip if defaultToUS is true or we already have a specific center
    if (defaultToUS || center) return;
    
    setIsGettingLocation(true);
    
    // Check if geolocation is available
    if ('geolocation' in navigator) {
      console.log('Requesting user location...');
      
      // Request the user's location
      navigator.geolocation.getCurrentPosition(
        // Success handler
        (position) => {
          console.log('Got user location:', position.coords);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
        },
        // Error handler
        (error) => {
          console.warn('Geolocation error:', error.message);
          setLocationError(error.message);
          setIsGettingLocation(false);
        },
        // Options
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser');
      setLocationError('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
    }
  }, [defaultToUS, center]);
  
  // Make sure we always have a center point to prevent map loading issues
  // Priority order: 1. Specific center prop, 2. User location, 3. Default US center
  // If defaultToUS is true, always use the US default center
  const mapCenter = defaultToUS 
    ? defaultCenter 
    : (center || (userLocation ? {...userLocation, zoom: 13} : defaultCenter));
  
  // Import the map components with a dynamic approach
  // Use dynamic imports to load at runtime
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapImports, setMapImports] = useState<any>(null);
  
  // Load map components and CSS on client side only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Add CSS directly to the head using CDN links (more reliable than imports)
    const addCssLink = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };
    
    // Load Leaflet CSS from CDN
    addCssLink('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    addCssLink('https://unpkg.com/leaflet-defaulticon-compatibility@0.1.2/dist/leaflet-defaulticon-compatibility.css');
    
    // Add our custom CSS styles directly to the document
    const style = document.createElement('style');
    style.textContent = `
      /* Custom map styles */
      .leaflet-container {
        width: 100%;
        height: 100%;
      }
      
      .leaflet-div-icon {
        background: transparent;
        border: none;
      }
      
      /* Marker styling */
      .marker-free-fallback,
      .marker-low-fallback,
      .marker-high-fallback {
        background: transparent;
        border: none;
      }
      
      /* Popup styling */
      .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        padding: 0;
      }
      
      .leaflet-popup-content {
        margin: 12px;
        line-height: 1.5;
      }
      
      .leaflet-popup-tip {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      }
      
      /* User location styling */
      .user-location-active {
        background-color: #4285F4 !important;
      }
      
      .user-location-active svg {
        color: white !important;
      }
      
      /* User location marker */
      .user-location-marker {
        z-index: 1000 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Import the map components directly
    import('./MapComponentsWrapper')
      .then(module => {
        setMapImports(module.default);
        setMapLoaded(true);
      })
      .catch(error => {
        console.error("Failed to load map components:", error);
      });
  }, []);
  
  // Get map components once they're loaded
  const MapContainer = mapImports?.MapContainer;
  const TileLayer = mapImports?.TileLayer;
  const Marker = mapImports?.Marker;
  const Popup = mapImports?.Popup;
  const MapBounds = mapImports?.MapBounds;
  const MapCenter = mapImports?.MapCenter;
  const createCustomMarkerIcon = mapImports?.createCustomMarkerIcon;
  
  // Log locations being passed to the map
  useEffect(() => {
    if (!locations || locations.length === 0) {
      console.log("No locations provided to map");
    } else {
      console.log(`Map has ${locations.length} locations to display`);
    }
  }, [locations]);
  
  // Format coordinates for debugging
  const formatCoord = (coord: any) => {
    if (!coord) return 'undefined';
    return `{lat: ${coord.lat}, lng: ${coord.lng}, zoom: ${coord.zoom}}`;
  };
  
  // Check for invalid center data
  if (mapCenter && (isNaN(mapCenter.lat) || isNaN(mapCenter.lng))) {
    console.error("Invalid map center coordinates:", mapCenter);
    return (
      <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden shadow-lg border border-[#222222] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error: Invalid map coordinates</p>
          <p className="text-sm text-[#AAAAAA]">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
  
  // Handle map initialization
  const handleMapInit = (map: any) => {
    console.log("Map initialized successfully");
    setIsMapReady(true);
  };
  
  // If map components aren't loaded yet, show loading state
  if (!mapLoaded || !mapImports || !MapContainer) {
    return (
      <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden shadow-lg border border-[#222222] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-[#AAAAAA]">Loading map components...</p>
          <p className="text-xs text-[#666666] mt-2">This may take a moment on first load</p>
        </div>
      </div>
    );
  }
  
  // Filter to valid locations only
  const validLocations = locations.filter(location => (
    !isNaN(location.lat) && 
    !isNaN(location.lng) && 
    location.lat !== 0 && 
    location.lng !== 0
  ));
  
  // Function to handle requesting the user's location
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }
    
    setIsGettingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Got user location:', position.coords);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
        
        // If map is ready, center it on user's location
        if (isMapReady && mapImports?.MapCenter) {
          // This will be handled by the MapCenter component when userLocation changes
          console.log('Map is ready, centering on user location');
        }
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setLocationError(error.message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
  
  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden shadow-lg border border-[#222222] relative">
      {/* Location button */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button 
          onClick={handleRequestLocation}
          disabled={isGettingLocation}
          className={`bg-white p-2 rounded-md shadow-md hover:bg-gray-100 transition-colors ${userLocation ? 'user-location-active' : ''}`}
          title="Find my location"
          aria-label="Find my location"
        >
          {isGettingLocation ? (
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-[#4285F4]"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4285F4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
        
        {locationError && (
          <div className="bg-white mt-2 p-2 rounded-md shadow-md text-xs text-red-500 max-w-[200px]">
            {locationError}
          </div>
        )}
      </div>
      
      <MapContainer 
        center={[mapCenter.lat, mapCenter.lng]} 
        zoom={mapCenter.zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenReady={handleMapInit}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render markers for all valid locations */}
        {validLocations.map((location) => (
          <Marker 
            key={location.id} 
            position={[location.lat, location.lng]} 
            icon={createCustomMarkerIcon(location.tier) || undefined}
          >
            <Popup>
              <div className="text-black">
                <h3 className="font-bold text-base">{location.name}</h3>
                <p className="text-sm">{location.address}</p>
                <p className="text-sm">{location.city}, {location.state}</p>
                {location.phone && <p className="text-sm mt-1">{location.phone}</p>}
                {location.rating && <p className="text-sm mt-1">Rating: {location.rating}★</p>}
                <a 
                  href={`/clinic/${location.id}`}
                  className="mt-2 inline-block bg-[#FF3B3B] hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-md transition-colors"
                >
                  View Profile
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render user location marker if available */}
        {userLocation && (
          <Marker 
            key="user-location" 
            position={[userLocation.lat, userLocation.lng]}
            icon={L ? L.divIcon({
              html: `
                <div style="
                  background-color: #4285F4; 
                  border: 2px solid white;
                  border-radius: 50%;
                  height: 16px;
                  width: 16px;
                  box-shadow: 0 0 0 2px #4285F4, 0 0 10px rgba(0,0,0,0.35);
                "></div>
                <div style="
                  background-color: rgba(66, 133, 244, 0.2);
                  border-radius: 50%;
                  height: 40px;
                  width: 40px;
                  position: absolute;
                  top: -12px;
                  left: -12px;
                  z-index: -1;
                "></div>
              `,
              className: 'user-location-marker',
              iconSize: [0, 0],
              iconAnchor: [8, 8]
            }) : undefined}
          >
            <Popup>
              <div className="text-black">
                <h3 className="font-bold text-base">Your Location</h3>
                <p className="text-sm">This is your current location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Center on user location if available */}
        {!defaultToUS && !center && userLocation && MapCenter && (
          <MapCenter lat={userLocation.lat} lng={userLocation.lng} zoom={13} />
        )}
        
        {/* Default centering options */}
        {defaultToUS && MapCenter && (
          <MapCenter lat={defaultCenter.lat} lng={defaultCenter.lng} zoom={defaultCenter.zoom} />
        )}
        
        {!defaultToUS && !center && !userLocation && !singleLocation && validLocations.length > 0 && MapBounds && (
          <MapBounds locations={validLocations} />
        )}
        
        {!defaultToUS && center && MapCenter && (
          <MapCenter lat={center.lat} lng={center.lng} zoom={center.zoom} />
        )}
        
        {!defaultToUS && !center && !userLocation && (!validLocations || validLocations.length === 0) && MapCenter && (
          <MapCenter lat={defaultCenter.lat} lng={defaultCenter.lng} zoom={defaultCenter.zoom} />
        )}
      </MapContainer>
    </div>
  );
};

// Utility function to geocode address using Nominatim
export const geocodeAddress = async (
  address: string, 
  city: string, 
  state: string
): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Check if we're on the server side or if nominatim isn't available
    if (typeof window === 'undefined' || !nominatim) {
      console.warn('geocodeAddress was called on the server side or nominatim is not available. Returning default values.');
      return {
        lat: 39.8283, // Default US center
        lng: -98.5795
      };
    }
    
    const query = `${address}, ${city}, ${state}`;
    const results = await nominatim.geocode({
      q: query,
      addressdetails: true,
      limit: 1,
      countrycodes: 'us',
    });

    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Utility function to geocode city and state using Nominatim
export const geocodeCityState = async (
  city: string,
  state: string
): Promise<{ lat: number; lng: number; zoom: number } | null> => {
  // Default values to use as fallback
  const defaultResult = {
    lat: 39.8283, // Default US center
    lng: -98.5795,
    zoom: 4
  };
  
  try {
    // Check if we're on the server side
    if (typeof window === 'undefined') {
      console.warn('geocodeCityState was called on the server side. Returning default values.');
      return defaultResult;
    }
    
    // Try to use the library if it's loaded - otherwise check in 100ms
    if (!nominatim) {
      console.log('Nominatim library not yet loaded for geocoding, will retry or use default...');
      
      // Create a promise that will try the library again after a short delay
      const retryPromise = new Promise<{ lat: number; lng: number; zoom: number }>((resolve) => {
        // Wait a moment and try again - the library might have loaded by then
        setTimeout(async () => {
          if (nominatim) {
            console.log('Nominatim library now available for geocoding, retrying...');
            try {
              const query = `${city}, ${state}, USA`;
              const results = await nominatim.geocode({
                q: query,
                addressdetails: true,
                limit: 1,
                countrycodes: 'us',
              });

              if (results && results.length > 0) {
                // Determine appropriate zoom level based on the type of result
                let zoom = 12; // Default for cities
                
                if (results[0].type === 'state' || results[0].type === 'administrative') {
                  zoom = 7;
                } else if (results[0].type === 'county') {
                  zoom = 9;
                } else if (results[0].type === 'neighbourhood' || results[0].type === 'suburb') {
                  zoom = 14;
                }
                
                resolve({
                  lat: parseFloat(results[0].lat),
                  lng: parseFloat(results[0].lon),
                  zoom,
                });
                return;
              }
            } catch (e) {
              console.warn('Error on retry with nominatim library for geocoding:', e);
            }
          }
          
          // If we still can't use the library or it fails, use default values
          resolve(defaultResult);
        }, 100);
      });
      
      return retryPromise;
    }
    
    // Normal path when nominatim is available
    console.log('Attempting to geocode:', city, state);
    
    const query = `${city}, ${state}, USA`;
    const results = await nominatim.geocode({
      q: query,
      addressdetails: true,
      limit: 1,
      countrycodes: 'us',
    });

    if (results && results.length > 0) {
      // Determine appropriate zoom level based on the type of result
      let zoom = 12; // Default for cities
      
      if (results[0].type === 'state' || results[0].type === 'administrative') {
        zoom = 7;
      } else if (results[0].type === 'county') {
        zoom = 9;
      } else if (results[0].type === 'neighbourhood' || results[0].type === 'suburb') {
        zoom = 14;
      }
      
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
        zoom,
      };
    }
    
    // If no results found, use the default values
    console.warn('No geocoding results found for:', city, state);
    return defaultResult;
  } catch (error) {
    console.error('Geocoding error:', error);
    return defaultResult;
  }
};

// Reverse geocoding: Convert coordinates to city and state
export const reverseGeocode = async (
  lat: number, 
  lon: number
): Promise<{ city: string; state: string } | null> => {
  try {
    // Check if we're on the server side
    if (typeof window === 'undefined') {
      console.warn('reverseGeocode was called on the server side. Returning default location.');
      // For server-side rendering, return a default location
      return getDefaultLocationEstimate();
    }
    
    // Try to use the library if it's loaded - otherwise check in 100ms
    if (!nominatim) {
      console.log('Nominatim library not yet loaded, will retry or use fallback...');
      
      // Create a promise that will try the library again after a short delay
      const retryPromise = new Promise<{ city: string; state: string } | null>((resolve) => {
        // Wait a moment and try again - the library might have loaded by then
        setTimeout(async () => {
          if (nominatim) {
            console.log('Nominatim library now available, retrying...');
            try {
              const results = await nominatim.reverse({
                lat: lat.toString(),
                lon: lon.toString(),
                addressdetails: true,
                zoom: 10,
              });
              
              if (results && results.address) {
                const address = results.address;
                const city = address.city || address.town || address.village || address.hamlet || address.suburb || address.county;
                let state = address.state;
                if (address.state_code) {
                  state = address.state_code;
                }
                
                if (city && state) {
                  resolve({ city, state });
                  return;
                }
              }
            } catch (e) {
              console.warn('Error on retry with nominatim library:', e);
            }
          }
          
          // If we still can't use the library or it fails, use the fallback
          const fallbackResult = await fallbackReverseGeocode(lat, lon);
          resolve(fallbackResult);
        }, 100);
      });
      
      return retryPromise;
    }
    
    // Normal path when nominatim is available
    console.log('Attempting to reverse geocode with coordinates:', lat, lon);
    
    try {
      const results = await nominatim.reverse({
        lat: lat.toString(),
        lon: lon.toString(),
        addressdetails: true,
        zoom: 10, // Level of detail (higher = more detailed)
      });
      
      if (results && results.address) {
        // Parse city and state from results
        const address = results.address;
        
        // Try multiple fields for city, as Nominatim can return different structures
        const city = address.city || address.town || address.village || address.hamlet || address.suburb || address.county;
        
        // Get state (in US this might be state or state_code)
        let state = address.state;
        
        // Convert state abbreviation if needed
        if (address.state_code) {
          state = address.state_code;
        }
        
        console.log('Extracted location:', { city, state });
        
        if (city && state) {
          return { city, state };
        }
      }
      
      // If nominatim library failed to get a result, try the fallback
      return fallbackReverseGeocode(lat, lon);
    } catch (nomErr) {
      console.error('Error using nominatim library:', nomErr);
      // If nominatim library throws, try the fallback
      return fallbackReverseGeocode(lat, lon);
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return fallbackReverseGeocode(lat, lon);
  }
};

// Fallback reverse geocoding using direct API call to OpenStreetMap Nominatim
const fallbackReverseGeocode = async (lat: number, lon: number): Promise<{ city: string; state: string } | null> => {
  try {
    console.log('Using fallback reverse geocoding for:', lat, lon);
    
    // Direct call to OpenStreetMap Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en-US`,
      {
        headers: {
          'User-Agent': 'MensHealthFinder/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fallback geocoding response:', data);
    
    if (data && data.address) {
      const address = data.address;
      
      // Try to extract city and state from address object
      const city = address.city || address.town || address.village || address.hamlet || address.suburb || address.county;
      let state = address.state;
      
      // Try to get state code if available
      if (address.state_code) {
        state = address.state_code;
      }
      
      // Some responses provide the ISO3166-2 code which looks like "US-TX"
      if (!state && address['ISO3166-2-lvl4']) {
        const parts = address['ISO3166-2-lvl4'].split('-');
        if (parts.length === 2) {
          state = parts[1];
        }
      }
      
      console.log('Fallback extracted location:', { city, state });
      
      if (city && state) {
        return { city, state };
      }
    }
    
    // If we couldn't parse the response properly, use a hardcoded value based on IP geolocation estimate
    // This is a last resort only when all other methods fail
    return getDefaultLocationEstimate();
  } catch (error) {
    console.error('Fallback reverse geocoding error:', error);
    // Last resort - return an estimated location 
    return getDefaultLocationEstimate();
  }
};

// Function to get a default location estimate when all else fails
// In a production app, this would use an IP geolocation service
const getDefaultLocationEstimate = (): { city: string; state: string } => {
  // For demo purposes, return Austin, TX as a default
  // In a real app, you'd use an IP geolocation service here
  return { city: 'Austin', state: 'TX' };
};

// Import the proper clinic URL path creation function from utils
import { createClinicUrlPath } from '../lib/utils';

// Helper function to create clinic URL for backwards compatibility
export const createClinicUrl = (
  categoryId: string,
  clinic: {
    id?: number;
    state: string;
    city: string;
    name: string;
  }
) => {
  // If the clinic has an ID and we're using it for direct linking, use the clinic ID route
  if (clinic.id) {
    return `/clinic/${clinic.id}`;
  }
  
  // Otherwise use the SEO-friendly URL structure
  return createClinicUrlPath(categoryId, clinic);
};

export default Map;