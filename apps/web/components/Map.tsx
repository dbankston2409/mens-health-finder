import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAutoLocation } from '../hooks/useAutoLocation';

// Import and initialize libraries on the client side only
let nominatim: any = null;
let L: any = null;

// This will run in the browser, but not during server-side rendering
if (typeof window !== 'undefined') {
  import('nominatim-browser').then(mod => {
    nominatim = mod.default;
    console.log("Nominatim library import successful");
  }).catch(err => {
    console.error("Failed to import nominatim library:", err);
  });
  
  import('leaflet').then(mod => {
    L = mod;
    console.log("Leaflet import successful");
    
    // Load compatibility module for icons
    import('leaflet-defaulticon-compatibility').catch(err => 
      console.error("Error importing leaflet compatibility:", err)
    );
  }).catch(err => {
    console.error("Error importing Leaflet:", err);
  });
}

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
  const [MapComponentsWrapper, setMapComponentsWrapper] = useState<any>(null);
  
  // Use the new auto-location hook
  const { location: autoLocation, isLoading: isLoadingLocation } = useAutoLocation();
  
  // Default center is the US
  const defaultCenter = { lat: 39.8283, lng: -98.5795, zoom: 4 }; 
  
  // Determine the map center based on props and auto-location
  const getMapCenter = () => {
    // If explicit center is provided, use it
    if (center) return center;
    
    // If defaultToUS is true, use US center
    if (defaultToUS) return defaultCenter;
    
    // If we have auto-detected location, use it with city-level zoom
    if (autoLocation && !isLoadingLocation) {
      return {
        lat: autoLocation.lat,
        lng: autoLocation.lng,
        zoom: 11 // City-level zoom
      };
    }
    
    // If locations array has items, center on them
    if (locations.length > 0) {
      const bounds = {
        north: Math.max(...locations.map(l => l.lat)),
        south: Math.min(...locations.map(l => l.lat)),
        east: Math.max(...locations.map(l => l.lng)),
        west: Math.min(...locations.map(l => l.lng))
      };
      
      return {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2,
        zoom: singleLocation ? 15 : 10
      };
    }
    
    // Fall back to US center
    return defaultCenter;
  };
  
  // Dynamically import MapComponentsWrapper
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('./MapComponentsWrapper').then(module => {
        setMapComponentsWrapper(() => module.default);
        setIsMapReady(true);
      }).catch(err => {
        console.error("Failed to load MapComponentsWrapper:", err);
      });
    }
  }, []);
  
  // Add custom styles for the map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure Leaflet CSS is available
      const checkLeafletCSS = () => {
        const hasLeafletCSS = document.querySelector('link[href*="leaflet.css"]');
        if (!hasLeafletCSS) {
          // Leaflet CSS should be imported via CSS import, not dynamically added
          console.log("Leaflet CSS should be imported in globals.css");
        }
      };
      checkLeafletCSS();
    }
  }, []);
  
  if (!isMapReady || !MapComponentsWrapper) {
    return (
      <div className={`bg-gray-100 animate-pulse rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-gray-500">
          {isLoadingLocation ? 'Detecting your location...' : 'Loading map...'}
        </div>
      </div>
    );
  }
  
  const mapCenter = getMapCenter();
  
  return (
    <div className="relative">
      {/* Show location indicator if using auto-location */}
      {autoLocation && !defaultToUS && !center && (
        <div className="absolute top-2 left-2 z-10 bg-white px-3 py-1 rounded-md shadow-sm text-sm text-gray-600">
          Centered on {autoLocation.city}, {autoLocation.stateCode}
        </div>
      )}
      
      <MapComponentsWrapper 
        locations={locations}
        mapCenter={mapCenter}
        height={height}
        userLocation={autoLocation ? { lat: autoLocation.lat, lng: autoLocation.lng } : null}
      />
    </div>
  );
};

// Export as dynamic component with SSR disabled
export default dynamic(() => Promise.resolve(Map), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 animate-pulse rounded-lg flex items-center justify-center" style={{ height: '500px' }}>
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
});