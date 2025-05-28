import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
// Import nominatim as a CommonJS module with proper fallback
// Wait for the browser to be fully loaded before initializing
let nominatim: any = null;
if (typeof window !== 'undefined') {
  // Delay initialization to ensure window is fully loaded
  setTimeout(() => {
    try {
      nominatim = require('nominatim-browser').default;
      console.log("Nominatim library initialized successfully");
    } catch (e) {
      console.error("Failed to initialize nominatim library:", e);
    }
  }, 0);
}

// Client-side code to handle leaflet
let L: any = null;
// Use a try-catch block to gracefully handle any import errors
if (typeof window !== 'undefined') {
  try {
    // Ensure leaflet is loaded before other dependencies
    L = require('leaflet');
    // Load styles and compatibility after L is loaded
    require('leaflet/dist/leaflet.css');
    require('leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css');
    require('leaflet-defaulticon-compatibility');
    console.log("Leaflet and dependencies loaded successfully");
  } catch (error) {
    console.error("Error loading Leaflet:", error);
  }
}

// Preload react-leaflet immediately to speed up loading
// We're not waiting for imports to happen lazily
let preloadedReactLeaflet: any = null;
if (typeof window !== 'undefined') {
  // Immediately start loading react-leaflet in the background
  import('react-leaflet').then((mod) => {
    preloadedReactLeaflet = mod;
    console.log("Preloaded react-leaflet successfully");
  }).catch(err => {
    console.error("Failed to preload react-leaflet:", err);
  });
}

// Create client-side only leaflet components with optimized loading
const MapComponents = dynamic(
  () => {
    // If we already have the preloaded module, use it immediately
    if (preloadedReactLeaflet) {
      console.log("Using preloaded react-leaflet components");
      return Promise.resolve().then(() => {
        try {
          const mod = preloadedReactLeaflet;
          const { MapContainer, TileLayer, Marker, Popup, useMap } = mod;
          
          // Create MapBounds component
          const MapBounds = ({ locations }: { locations: ClinicLocation[] }) => {
            const map = useMap();
            
            useEffect(() => {
              if (locations && locations.length > 0 && L) {
                try {
                  const validLocations = locations.filter(loc => 
                    !isNaN(loc.lat) && !isNaN(loc.lng) && loc.lat !== 0 && loc.lng !== 0
                  );
                  
                  if (validLocations.length === 0) {
                    console.warn("No valid locations for MapBounds");
                    return;
                  }
                  
                  const bounds = L.latLngBounds(validLocations.map(loc => [loc.lat, loc.lng]));
                  map.fitBounds(bounds, { padding: [50, 50] });
                  console.log("Map bounds set successfully");
                } catch (error) {
                  console.error("Error setting map bounds:", error);
                }
              }
            }, [locations, map]);
            
            return null;
          };
          
          // Create MapCenter component
          const MapCenter = ({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) => {
            const map = useMap();
            
            useEffect(() => {
              try {
                if (isNaN(lat) || isNaN(lng)) {
                  console.error("Invalid coordinates provided to MapCenter:", { lat, lng });
                  return;
                }
                map.setView([lat, lng], zoom);
                console.log("Map center set to:", { lat, lng, zoom });
              } catch (error) {
                console.error("Error setting map center:", error);
              }
            }, [lat, lng, zoom, map]);
            
            return null;
          };
          
          console.log("Map components processed successfully");
          
          return {
            MapContainer,
            TileLayer,
            Marker,
            Popup,
            MapBounds,
            MapCenter
          };
        } catch (error) {
          console.error("Error processing preloaded map components:", error);
          throw error; // Re-throw to fall back to the normal loading
        }
      });
    }
    
    // Normal loading path if preloading failed
    return import('react-leaflet').then((mod) => {
      try {
        console.log("Loading react-leaflet components normally...");
        
        // Get all needed components from the module
        const { MapContainer, TileLayer, Marker, Popup, useMap } = mod;
        
        if (!MapContainer || !TileLayer || !Marker || !Popup || !useMap) {
          console.error("Failed to load required components from react-leaflet");
          throw new Error("Failed to load essential map components");
        }
        
        // Create MapBounds component
        const MapBounds = ({ locations }: { locations: ClinicLocation[] }) => {
          const map = useMap();
          
          useEffect(() => {
            if (locations && locations.length > 0 && L) {
              try {
                const validLocations = locations.filter(loc => 
                  !isNaN(loc.lat) && !isNaN(loc.lng) && loc.lat !== 0 && loc.lng !== 0
                );
                
                if (validLocations.length === 0) {
                  console.warn("No valid locations for MapBounds");
                  return;
                }
                
                const bounds = L.latLngBounds(validLocations.map(loc => [loc.lat, loc.lng]));
                map.fitBounds(bounds, { padding: [50, 50] });
                console.log("Map bounds set successfully");
              } catch (error) {
                console.error("Error setting map bounds:", error);
              }
            }
          }, [locations, map]);
          
          return null;
        };
        
        // Create MapCenter component
        const MapCenter = ({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) => {
          const map = useMap();
          
          useEffect(() => {
            try {
              if (isNaN(lat) || isNaN(lng)) {
                console.error("Invalid coordinates provided to MapCenter:", { lat, lng });
                return;
              }
              map.setView([lat, lng], zoom);
              console.log("Map center set to:", { lat, lng, zoom });
            } catch (error) {
              console.error("Error setting map center:", error);
            }
          }, [lat, lng, zoom, map]);
          
          return null;
        };
        
        console.log("Map components loaded successfully");
        
        // Return all components
        return {
          MapContainer,
          TileLayer,
          Marker,
          Popup,
          MapBounds,
          MapCenter
        };
      } catch (error) {
        console.error("Error loading map components:", error);
        // Return empty objects so the component can handle the error gracefully
        return {
          MapContainer: null,
          TileLayer: null,
          Marker: null,
          Popup: null,
          MapBounds: null,
          MapCenter: null
        };
      }
    });
  },
  { 
    ssr: false,
    loading: () => (
      <div style={{ height: '400px', width: '100%' }} 
        className="rounded-xl overflow-hidden shadow-lg border border-[#222222] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-[#AAAAAA]">Loading map...</p>
          <p className="text-xs text-[#666666] mt-2">This may take a moment on first load</p>
        </div>
      </div>
    )
  }
);

// Tier-based marker customization with enhanced clustering support
const createCustomMarkerIcon = (tier: 'free' | 'low' | 'high') => {
  // Only create icons on the client side where L (leaflet) is available
  if (typeof window === 'undefined' || !L) {
    console.warn("Attempted to create marker icon when Leaflet wasn't available");
    return null;
  }
  
  let size: [number, number];
  let zIndexOffset: number;
  let iconUrl: string;
  let fallbackColor: string;
  
  try {
    switch (tier) {
      case 'high':
        // Premium tier: Largest map pin (Gold)
        size = [42, 42];
        iconUrl = '/images/markers/marker-high.png';
        zIndexOffset = 1000;
        fallbackColor = '#FFD700'; // Gold
        break;
      case 'low':
        // Enhanced tier: Mid-sized pin (Red)
        size = [36, 36];
        iconUrl = '/images/markers/marker-low.png';
        zIndexOffset = 500;
        fallbackColor = '#FF3B3B'; // Red
        break;
      case 'free':
      default:
        // Free tier: Basic pin (Grey)
        size = [30, 30]; 
        iconUrl = '/images/markers/marker-free.png';
        zIndexOffset = 0;
        fallbackColor = '#888888'; // Grey
    }

    // Try to create image-based icon first
    try {
      return L.icon({
        iconUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
        popupAnchor: [0, -size[1]],
        className: `marker-${tier}`,
        zIndexOffset
      });
    } catch (iconError) {
      console.warn("Image icon failed, using div icon fallback:", iconError);
      // Fall through to div icon
    }
    
    // Create div-based icon as fallback
    return L.divIcon({
      className: `marker-${tier}-fallback`,
      html: `
        <div style="
          background-color: ${fallbackColor}; 
          width: ${size[0]}px; 
          height: ${size[1]}px; 
          border-radius: 50% 50% 50% 0; 
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transform: rotate(-45deg);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            color: white;
            font-size: ${size[0] * 0.4}px;
            font-weight: bold;
          ">📍</div>
        </div>
      `,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
      zIndexOffset
    });
    
  } catch (e) {
    console.error("All marker creation methods failed:", e);
    // Return null to use default Leaflet icon
    return null;
  }
};

// Create cluster icon based on clinic tiers
const createClusterIcon = (cluster: any) => {
  if (typeof window === 'undefined' || !L) {
    return null;
  }
  
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  
  // Count by tier
  let premiumCount = 0;
  let enhancedCount = 0;
  let freeCount = 0;
  
  markers.forEach((marker: any) => {
    const tier = marker.options.tier || 'free';
    switch (tier) {
      case 'high': premiumCount++; break;
      case 'low': enhancedCount++; break;
      default: freeCount++; break;
    }
  });
  
  // Determine dominant tier
  let dominantTier = 'free';
  let dominantColor = '#888888';
  
  if (premiumCount > enhancedCount && premiumCount > freeCount) {
    dominantTier = 'high';
    dominantColor = '#FFD700';
  } else if (enhancedCount > freeCount) {
    dominantTier = 'low';
    dominantColor = '#FF3B3B';
  }
  
  // Size based on count
  let size = 40;
  if (count > 100) size = 70;
  else if (count > 50) size = 60;
  else if (count > 10) size = 50;
  
  return L.divIcon({
    html: `
      <div style="
        background: ${dominantColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size * 0.3}px;
      ">
        ${count}
      </div>
    `,
    className: `marker-cluster marker-cluster-${dominantTier}`,
    iconSize: [size, size]
  });
};

interface ClinicLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  tier: 'free' | 'low' | 'high';
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [mapCenterState, setMapCenterState] = useState<{lat: number; lng: number; zoom: number} | null>(null);
  
  // Default center is the US
  const defaultCenter = { lat: 39.8283, lng: -98.5795, zoom: 4 }; 
  
  // Make sure we always have a center point to prevent map loading issues
  // If defaultToUS is true, always use the US default center
  const mapCenter = defaultToUS ? defaultCenter : (center || defaultCenter);
  
  // Get map components from dynamic import
  const { MapContainer, TileLayer, Marker, Popup, MapBounds, MapCenter } = MapComponents;
  
  // Debug logging for center prop changes
  useEffect(() => {
    if (center) {
      console.log("CENTER PROP CHANGED:", center);
      setMapCenterState(center);
    }
  }, [center]);
  
  // Debug logging for passed locations
  useEffect(() => {
    if (locations && locations.length > 0) {
      console.log(`Received ${locations.length} locations for map:`, 
        locations.map(l => ({ id: l.id, name: l.name, coords: [l.lat, l.lng], tier: l.tier })));
      
      // Check if any locations have the exact same coordinates (could cause map issues)
      const coordsMap = {}; // Use a simple object instead of JS built-in Map to avoid naming conflict
      const duplicates = [];
      
      for (const loc of locations) {
        const coordKey = `${loc.lat},${loc.lng}`;
        if (coordKey in coordsMap) {
          duplicates.push({ id: loc.id, name: loc.name, coords: [loc.lat, loc.lng] });
        } else {
          coordsMap[coordKey] = loc;
        }
      }
      
      if (duplicates.length > 0) {
        console.warn("Found locations with duplicate coordinates:", duplicates);
      }
    } else {
      console.log("No locations provided to map or empty locations array");
    }
  }, [locations]);
  
  // Effect to check if map components are loaded
  useEffect(() => {
    // We're using this effect to check if MapComponents has loaded
    if (MapContainer && TileLayer && Marker && Popup) {
      console.log("Map components successfully loaded");
      setComponentsLoaded(true);
    } else {
      console.warn("Map components not yet loaded");
    }
  }, [MapContainer, TileLayer, Marker, Popup]);

  // Effect to track map loading
  useEffect(() => {
    // Only start the timeout if the components have loaded but the map isn't ready yet
    if (componentsLoaded && !isMapReady) {
      console.log("Map components loaded, waiting for map initialization...");
      
      // Use a timeout to detect if the map is taking too long to load
      const mapLoadTimeout = setTimeout(() => {
        if (!isMapReady) {
          console.warn("Map is taking longer than expected to initialize");
          // Don't set an error yet, just log a warning
        }
      }, 3000);
      
      // Clean up the timeout
      return () => clearTimeout(mapLoadTimeout);
    }
  }, [componentsLoaded, isMapReady]);

  // Verify location data is valid and log any issues
  useEffect(() => {
    // Only validate locations if we have any
    if (locations && locations.length > 0) {
      const invalidLocations = locations.filter(loc => 
        isNaN(loc.lat) || 
        isNaN(loc.lng) || 
        loc.lat === 0 || 
        loc.lng === 0 ||
        !loc.lat || 
        !loc.lng
      );
      
      const validLocations = locations.filter(loc => 
        !isNaN(loc.lat) && 
        !isNaN(loc.lng) && 
        loc.lat !== 0 && 
        loc.lng !== 0
      );
      
      console.log(`Map has ${validLocations.length} valid locations and ${invalidLocations.length} invalid locations`);
      
      if (invalidLocations.length > 0) {
        console.warn("Invalid location data detected in map:", invalidLocations);
        
        // Only set error if all locations are invalid
        if (invalidLocations.length === locations.length) {
          setMapError("Location data is invalid");
        } else {
          console.log("Some valid locations exist, map will still work");
        }
      }
    }
  }, [locations]);
  
  // Function to handle map initialization
  const handleMapInit = (map: any) => {
    console.log("Map initialized successfully", map);
    setIsMapReady(true);
    
    // If we have a specific center, force update it as a safeguard
    if (center) {
      try {
        console.log("Setting map view on init to:", [center.lat, center.lng], center.zoom);
        map.target.setView([center.lat, center.lng], center.zoom);
      } catch (error) {
        console.error("Error setting map view on init:", error);
      }
    }
  };
  
  // Debug utility to format coordinates for logging
  const formatCoord = (coord: any) => {
    if (!coord) return 'undefined';
    return `{lat: ${coord.lat}, lng: ${coord.lng}, zoom: ${coord.zoom}}`;
  };
  
  // Log details about current center before rendering
  const effectiveCenter = mapCenter;
  console.log("Map render details:", {
    componentsLoaded,
    isMapReady,
    defaultToUS,
    centerProp: center ? formatCoord(center) : 'undefined',
    effectiveCenter: formatCoord(effectiveCenter),
    locationsCount: locations?.length || 0
  });
  
  // Return if we have invalid center data (this should never happen with the safeguards)
  if (effectiveCenter && (isNaN(effectiveCenter.lat) || isNaN(effectiveCenter.lng))) {
    console.error("Invalid map center coordinates:", effectiveCenter);
    return (
      <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden shadow-lg border border-[#222222] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error: Invalid map coordinates</p>
          <p className="text-sm text-[#AAAAAA]">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden shadow-lg border border-[#222222]">
      {componentsLoaded && MapContainer && TileLayer && Marker && Popup ? (
        <MapContainer 
          center={[effectiveCenter.lat, effectiveCenter.lng]} 
          zoom={effectiveCenter.zoom} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          whenReady={handleMapInit}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Map debug info overlay */}
          <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, display: 'none' }}>
            <div className="leaflet-control leaflet-bar bg-black/70 p-2 text-xs text-white" style={{ width: '250px' }}>
              <div>Center: {formatCoord(effectiveCenter)}</div>
              <div>Locations: {locations.length}</div>
              <div>Map Ready: {isMapReady ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          {locations
            .filter(location => (
              !isNaN(location.lat) && 
              !isNaN(location.lng) && 
              location.lat !== 0 && 
              location.lng !== 0
            ))
            .map((location) => (
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
            ))
          }
          
          {/* If defaultToUS is true, always show the full US view */}
          {defaultToUS && MapCenter && (
            <MapCenter lat={defaultCenter.lat} lng={defaultCenter.lng} zoom={defaultCenter.zoom} />
          )}
          
          {/* If not defaultToUS and no specific center is provided and we have locations, fit the map to show all markers */}
          {!defaultToUS && !center && !singleLocation && locations.length > 0 && MapBounds && (
            <MapBounds locations={locations} />
          )}
          
          {/* If not defaultToUS and a specific center is provided, center the map on that location */}
          {!defaultToUS && center && MapCenter && (
            <MapCenter lat={center.lat} lng={center.lng} zoom={center.zoom} />
          )}
          
          {/* If not defaultToUS and no specific center is provided and we have no locations, default to US view */}
          {!defaultToUS && !center && (!locations || locations.length === 0) && MapCenter && (
            <MapCenter lat={defaultCenter.lat} lng={defaultCenter.lng} zoom={defaultCenter.zoom} />
          )}
        </MapContainer>
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-[#AAAAAA]">Loading map components...</p>
            <p className="text-xs text-[#666666] mt-2">This may take a moment on first load</p>
          </div>
        </div>
      )}
      
      {/* Error message overlay - only show if we have an error */}
      {mapError && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 p-4 rounded-lg max-w-xs text-center">
            <p className="text-red-400 mb-2">{mapError}</p>
            <p className="text-sm text-[#AAAAAA]">Please try refreshing the page.</p>
          </div>
        </div>
      )}
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