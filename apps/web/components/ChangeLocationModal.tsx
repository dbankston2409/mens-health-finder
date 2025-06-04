import React, { useState, useEffect } from 'react';
import { AutoLocation } from '../hooks/useAutoLocation';

interface ChangeLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: AutoLocation) => void;
  currentLocation?: AutoLocation | null;
}

const POPULAR_CITIES = [
  { city: 'New York', state: 'New York', stateCode: 'NY', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'California', stateCode: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'Illinois', stateCode: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', state: 'Texas', stateCode: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', lat: 33.4484, lng: -112.0740 },
  { city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio', state: 'Texas', stateCode: 'TX', lat: 29.4241, lng: -98.4936 },
  { city: 'Dallas', state: 'Texas', stateCode: 'TX', lat: 32.7767, lng: -96.7970 },
  { city: 'San Diego', state: 'California', stateCode: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Austin', state: 'Texas', stateCode: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Denver', state: 'Colorado', stateCode: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Miami', state: 'Florida', stateCode: 'FL', lat: 25.7617, lng: -80.1918 },
];

export default function ChangeLocationModal({
  isOpen,
  onClose,
  onSelect,
  currentLocation
}: ChangeLocationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AutoLocation[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Use OpenStreetMap Nominatim for geocoding (free, no API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchTerm + ', USA'
        )}&format=json&countrycodes=us&limit=5`
      );
      const data = await response.json();

      const results = data.map((item: any) => {
        // Parse the display name to extract city and state
        const parts = item.display_name.split(', ');
        const city = parts[0];
        const state = parts.find((p: string) => p.length === 2) || parts[2] || '';
        
        return {
          city,
          state: state.length === 2 ? state : parts[2] || state,
          stateCode: state.length === 2 ? state : '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Location search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectLocation = (location: AutoLocation) => {
    onSelect(location);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Change Location</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {currentLocation && (
            <p className="mt-2 text-sm text-gray-600">
              Currently showing results near {currentLocation.city}, {currentLocation.stateCode}
            </p>
          )}
        </div>

        <div className="p-6">
          {/* Search Input */}
          <div className="mb-6">
            <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search by city or ZIP code
            </label>
            <div className="flex gap-2">
              <input
                id="location-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter city name or ZIP code"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(result)}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="font-medium text-gray-900">
                      {result.city}, {result.stateCode || result.state}
                    </div>
                    {result.displayName && (
                      <div className="text-sm text-gray-500 truncate">{result.displayName}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Cities */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Cities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={`${city.city}-${city.stateCode}`}
                  onClick={() => selectLocation(city)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                >
                  {city.city}, {city.stateCode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}