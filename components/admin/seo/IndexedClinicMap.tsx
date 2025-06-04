import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useSeoIndexStatus } from '../../../apps/web/utils/hooks/useSeoIndexStatus';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'});

// Custom icons for indexed vs not indexed
const indexedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const notIndexedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface FilterState {
  indexed: boolean | null;
  city: string;
  state: string;
  tier: string;
}

export function IndexedClinicMap() {
  const [filters, setFilters] = useState<FilterState>({
    indexed: null,
    city: '',
    state: '',
    tier: ''
  });
  
  const { clinics, loading, error, summary } = useSeoIndexStatus({
    indexed: filters.indexed ?? undefined,
    city: filters.city || undefined,
    state: filters.state || undefined,
    tier: filters.tier || undefined
  });
  
  const [center, setCenter] = useState<[number, number]>([39.8283, -98.5795]); // Center of US
  const [zoom, setZoom] = useState(4);
  
  // Filter clinics that have coordinates
  const mappableClinics = clinics.filter(clinic => clinic.lat && clinic.lng);
  
  // Get unique values for filter dropdowns
  const uniqueCities = [...new Set(clinics.map(c => c.city).filter(Boolean))].sort();
  const uniqueStates = [...new Set(clinics.map(c => c.state).filter(Boolean))].sort();
  const uniqueTiers = [...new Set(clinics.map(c => c.tier).filter(Boolean))].sort();
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Map</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">SEO Indexing Status Map</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-gray-600">Total Clinics</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.indexed}</div>
            <div className="text-sm text-gray-600">Indexed</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.notIndexed}</div>
            <div className="text-sm text-gray-600">Not Indexed</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.totalClicks}</div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <select
            value={filters.indexed === null ? 'all' : filters.indexed.toString()}
            onChange={(e) => setFilters({...filters, indexed: e.target.value === 'all' ? null : e.target.value === 'true'})}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="true">Indexed Only</option>
            <option value="false">Not Indexed Only</option>
          </select>
          
          <select
            value={filters.state}
            onChange={(e) => setFilters({...filters, state: e.target.value})}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All States</option>
            {uniqueStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          
          <select
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          
          <select
            value={filters.tier}
            onChange={(e) => setFilters({...filters, tier: e.target.value})}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Tiers</option>
            {uniqueTiers.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
          
          <button
            onClick={() => setFilters({ indexed: null, city: '', state: '', tier: '' })}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Map */}
      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mappableClinics.map(clinic => (
            <Marker
              key={clinic.slug}
              position={[clinic.lat!, clinic.lng!]}
              icon={clinic.indexed ? indexedIcon : notIndexedIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-lg">{clinic.name}</h3>
                  <p className="text-gray-600">{clinic.city}, {clinic.state}</p>
                  <p className="text-sm text-gray-500 mb-2">Slug: {clinic.slug}</p>
                  
                  <div className="mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      clinic.indexed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {clinic.indexed ? 'Indexed' : 'Not Indexed'}
                    </span>
                    {clinic.tier && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {clinic.tier}
                      </span>
                    )}
                  </div>
                  
                  {clinic.indexed && clinic.indexingMetrics && (
                    <div className="text-sm space-y-1">
                      <p><strong>Clicks:</strong> {clinic.indexingMetrics.clicks}</p>
                      <p><strong>CTR:</strong> {clinic.indexingMetrics.ctr.toFixed(2)}%</p>
                      {clinic.indexingMetrics.queries.length > 0 && (
                        <div>
                          <strong>Top Query:</strong>
                          <br />
                          <span className="text-gray-600 italic">
                            "{clinic.indexingMetrics.queries[0]}"
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {clinic.lastIndexed && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last indexed: {clinic.lastIndexed.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Showing {mappableClinics.length} clinics with location data</p>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Indexed ({summary.indexed})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Not Indexed ({summary.notIndexed})</span>
          </div>
        </div>
      </div>
    </div>
  );
}