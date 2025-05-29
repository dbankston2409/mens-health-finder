// Additional type declarations for Leaflet and related modules

// For dynamic imports with Next.js
declare module '@/components/MapComponentsWrapper' {
  import { FC } from 'react';
  import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
  
  // Define the component type
  const MapComponentsWrapper: FC & {
    MapContainer: typeof MapContainer;
    TileLayer: typeof TileLayer;
    Marker: typeof Marker;
    Popup: typeof Popup;
    MapBounds: FC<{ locations: any[] }>;
    MapCenter: FC<{ lat: number; lng: number; zoom: number }>;
    createCustomMarkerIcon: (tier: 'free' | 'low' | 'high') => any;
  };
  
  export default MapComponentsWrapper;
}

// For nominatim-browser
declare module 'nominatim-browser' {
  const nominatim: {
    geocode: (options: any) => Promise<any[]>;
    reverse: (options: any) => Promise<any>;
  };
  
  export default nominatim;
}

// For leaflet CSS
declare module 'leaflet/dist/leaflet.css' {
  const content: any;
  export default content;
}