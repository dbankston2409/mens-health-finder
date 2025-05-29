import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Import L only on the client side
let L: any = null;
if (typeof window !== 'undefined') {
  // This will execute only on the client side
  L = require('leaflet');
  
  // Also require compatibility for icons
  require('leaflet-defaulticon-compatibility');
  
  // CSS is handled in the Map component now - we're using CDN links
}

// Create MapBounds component
export const MapBounds = ({ locations }: { locations: any[] }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (!locations || locations.length === 0 || !L) {
      return; // Skip if no locations or Leaflet not loaded
    }
    
    try {
      const validLocations = locations.filter(loc => 
        !isNaN(loc.lat) && !isNaN(loc.lng) && loc.lat !== 0 && loc.lng !== 0
      );
      
      if (validLocations.length === 0) {
        console.warn("No valid locations for MapBounds");
        return;
      }
      
      const bounds = L.latLngBounds(validLocations.map((loc: any) => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
      console.log("Map bounds set successfully");
    } catch (error) {
      console.error("Error setting map bounds:", error);
    }
  }, [locations, map]);
  
  return null;
};

// Create MapCenter component
export const MapCenter = ({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates provided to MapCenter:", { lat, lng });
      return;
    }
    
    try {
      // Animate the transition to the new center
      map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1.5 // Animation duration in seconds
      });
      console.log("Map center set to:", { lat, lng, zoom });
    } catch (error) {
      console.error("Error setting map center:", error);
    }
  }, [lat, lng, zoom, map]);
  
  return null;
};

// Tier-based marker customization
export const createCustomMarkerIcon = (tier: 'free' | 'standard' | 'advanced' | 'low' | 'high' | string) => {
  // Only create icons on the client side where L (leaflet) is available
  if (typeof window === 'undefined' || !L) {
    return null;
  }
  
  let size: [number, number];
  let zIndexOffset: number;
  let iconUrl: string;
  let fallbackColor: string;
  
  // Normalize tier value to handle legacy values
  const normalizedTier = 
    tier === 'high' ? 'advanced' :
    tier === 'low' ? 'standard' :
    tier;
  
  try {
    switch (normalizedTier) {
      case 'advanced':
        // Advanced tier: Largest map pin (Gold)
        size = [42, 42];
        iconUrl = '/images/markers/marker-high.png';
        zIndexOffset = 1000;
        fallbackColor = '#FFD700'; // Gold
        break;
      case 'standard':
        // Standard tier: Mid-sized pin (Red)
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
        className: `marker-${normalizedTier}`,
        zIndexOffset
      });
    } catch (iconError) {
      console.warn("Image icon failed, using div icon fallback:", iconError);
      // Fall through to div icon
    }
    
    // Create div-based icon as fallback
    return L.divIcon({
      className: `marker-${normalizedTier}-fallback`,
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

// Export shared utility functions
export const mapUtils = {
  MapContainer,
  TileLayer,
  Marker, 
  Popup,
  MapBounds,
  MapCenter,
  createCustomMarkerIcon
};

// Create a simplified export object for Next.js dynamic imports
// This approach is more compatible with Next.js dynamic import system
const MapComponentsWrapper = {
  // Export a default component for React
  default: function MapWrapper({ children }: { children?: React.ReactNode }) {
    return <div>{children || "Map components loaded"}</div>;
  },
  
  // Export all the map components directly
  MapContainer,
  TileLayer,
  Marker, 
  Popup,
  MapBounds,
  MapCenter,
  createCustomMarkerIcon
};

export default MapComponentsWrapper;