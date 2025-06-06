import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { DiscoveryGrid, DiscoverySession } from '../../../types';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Rectangle = dynamic(() => import('react-leaflet').then(mod => mod.Rectangle), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface DiscoveryMapProps {
  session: DiscoverySession | null;
  onGridClick?: (grid: DiscoveryGrid) => void;
  showProgress?: boolean;
}

const DiscoveryMap: React.FC<DiscoveryMapProps> = ({ 
  session, 
  onGridClick,
  showProgress = true 
}) => {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getGridColor = (grid: DiscoveryGrid) => {
    switch (grid.status) {
      case 'completed':
        return '#10B981'; // green
      case 'searching':
        return '#F59E0B'; // yellow
      case 'error':
        return '#EF4444'; // red
      case 'pending':
      default:
        return '#6B7280'; // gray
    }
  };

  const getGridOpacity = (grid: DiscoveryGrid) => {
    switch (grid.status) {
      case 'completed':
        return 0.7;
      case 'searching':
        return 0.8;
      case 'error':
        return 0.6;
      case 'pending':
      default:
        return 0.3;
    }
  };

  const getGridBounds = (grid: any): [[number, number], [number, number]] => {
    // If grid has bounds, use them directly
    if (grid.bounds) {
      return [
        [grid.bounds.south, grid.bounds.west],
        [grid.bounds.north, grid.bounds.east]
      ];
    }
    
    // Otherwise calculate from lat/lng/radius
    if (grid.lat && grid.lng && grid.radius) {
      const halfSize = grid.radius / 111; // Convert km to approximate degrees
      return [
        [grid.lat - halfSize, grid.lng - halfSize],
        [grid.lat + halfSize, grid.lng + halfSize]
      ];
    }
    
    // Default fallback
    return [[0, 0], [0, 0]];
  };

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-[#111111] flex items-center justify-center rounded-lg border border-[#333333]">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-[#333333]">
      <MapContainer
        ref={mapRef}
        center={[39.8283, -98.5795]} // Center of US
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {session?.grids.map((grid, index) => (
          <Rectangle
            key={`grid-${index}`}
            bounds={getGridBounds(grid)}
            pathOptions={{
              color: getGridColor(grid),
              fillColor: getGridColor(grid),
              fillOpacity: getGridOpacity(grid),
              weight: 2
            }}
            eventHandlers={{
              click: () => onGridClick?.(grid)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-1">
                  Grid {index + 1}
                </h3>
                <div className="text-xs space-y-1">
                  <div>Status: <span className="capitalize">{grid.status}</span></div>
                  <div>Location: {grid.lat?.toFixed(4) || 'N/A'}, {grid.lng?.toFixed(4) || 'N/A'}</div>
                  {grid.radius && <div>Radius: {grid.radius}km</div>}
                  {grid.priority && (
                    <div>Priority: {grid.priority}</div>
                  )}
                  {typeof grid.clinicsFound === 'number' && (
                    <div>Clinics Found: {grid.clinicsFound}</div>
                  )}
                  {typeof grid.clinicsImported === 'number' && (
                    <div>Clinics Imported: {grid.clinicsImported}</div>
                  )}
                  {grid.error && (
                    <div className="text-red-600">Error: {grid.error}</div>
                  )}
                </div>
              </div>
            </Popup>
          </Rectangle>
        ))}
        
        {/* Show current search location if running */}
        {session?.status === 'running' && session.grids[session.currentGridIndex] && (() => {
          const currentGrid = session.grids[session.currentGridIndex];
          let markerLat, markerLng;
          
          if (currentGrid.bounds) {
            markerLat = (currentGrid.bounds.north + currentGrid.bounds.south) / 2;
            markerLng = (currentGrid.bounds.east + currentGrid.bounds.west) / 2;
          } else if (currentGrid.lat && currentGrid.lng) {
            markerLat = currentGrid.lat;
            markerLng = currentGrid.lng;
          } else {
            return null;
          }
          
          return (
            <Marker position={[markerLat, markerLng]}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm text-blue-600">
                    Currently Searching
                  </h3>
                  <div className="text-xs">
                    Grid {session.currentGridIndex + 1} of {session.grids.length}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })()}
      </MapContainer>
      
      {showProgress && session && (
        <div className="mt-4 p-4 bg-[#111111] rounded-lg border border-[#333333]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-white">Discovery Progress</h3>
            <span className="text-sm text-gray-400 capitalize">{session.status}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Grids Completed</div>
              <div className="font-semibold text-white">
                {session.grids.filter(g => g.status === 'completed').length} / {session.grids.length}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Clinics Found</div>
              <div className="font-semibold text-white">{session.clinicsFound}</div>
            </div>
            <div>
              <div className="text-gray-400">Clinics Imported</div>
              <div className="font-semibold text-white">{session.clinicsImported}</div>
            </div>
            <div>
              <div className="text-gray-400">Target</div>
              <div className="font-semibold text-white">{session.config.targetClinicCount}</div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>
                {Math.round((session.grids.filter(g => g.status === 'completed').length / session.grids.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(session.grids.filter(g => g.status === 'completed').length / session.grids.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>
          
          {session.errors && session.errors.length > 0 && (
            <div className="mt-3">
              <details className="text-sm">
                <summary className="text-red-400 cursor-pointer">
                  {session.errors.length} Error{session.errors.length !== 1 ? 's' : ''}
                </summary>
                <div className="mt-2 space-y-1 text-xs text-red-400 max-h-20 overflow-y-auto">
                  {session.errors.slice(-5).map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 p-3 bg-[#111111] rounded-lg border border-[#333333]">
        <h4 className="font-semibold text-sm mb-2 text-white">Grid Status Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded mr-2 opacity-30"></div>
            <span className="text-gray-300">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2 opacity-80"></div>
            <span className="text-gray-300">Searching</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2 opacity-70"></div>
            <span className="text-gray-300">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2 opacity-60"></div>
            <span className="text-gray-300">Error</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryMap;