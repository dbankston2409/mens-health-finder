import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import SearchSuggestions from './SearchSuggestions';
import { getSearchSuggestions } from '../lib/search';
import { getUserLocation, reverseGeocode, saveUserLocation } from '../utils/geoUtils';
import { debounce } from 'lodash';

interface SmartSearchBarProps {
  initialService?: string;
  initialLocation?: string;
  initialQuery?: string;
  onSearch?: (params: { service: string; location: string; query: string; coords?: { lat: number; lng: number } }) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  initialService = '',
  initialLocation = '',
  initialQuery = '',
  onSearch,
  className = '',
  placeholder = 'Search for clinics, services, or locations...',
  autoFocus = false
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [service, setService] = useState(initialService);
  const [location, setLocation] = useState(initialLocation);
  const [isFocused, setIsFocused] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    clinics: { id: string; name: string; city: string; state: string }[];
    services: string[];
    locations: { city: string; state: string }[];
  }>({
    clinics: [],
    services: [],
    locations: []
  });
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Fetch suggestions when query changes
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions({ clinics: [], services: [], locations: [] });
      return;
    }
    
    setSuggestionsLoading(true);
    
    try {
      const results = await getSearchSuggestions(searchQuery);
      setSuggestions(results);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };
  
  // Debounce the fetch suggestions function
  const debouncedFetchSuggestions = useRef(
    debounce((searchQuery: string) => fetchSuggestions(searchQuery), 300)
  ).current;
  
  // Effect to fetch suggestions when query changes
  useEffect(() => {
    debouncedFetchSuggestions(query);
    
    return () => {
      debouncedFetchSuggestions.cancel();
    };
  }, [query, debouncedFetchSuggestions]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Close suggestions
    setIsFocused(false);
    
    const searchParams = {
      service,
      location,
      query,
      coords: coordinates || undefined
    };
    
    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Default behavior: navigate to search page
      const queryParams = new URLSearchParams();
      
      if (query) queryParams.set('q', query);
      if (service) queryParams.set('service', service);
      if (location) queryParams.set('location', location);
      
      if (coordinates) {
        queryParams.set('lat', coordinates.lat.toString());
        queryParams.set('lng', coordinates.lng.toString());
      }
      
      router.push(`/search?${queryParams.toString()}`);
    }
  };
  
  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Auto-focus the input if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Get user's location
  const handleGetLocation = async () => {
    setIsLocating(true);
    
    try {
      // Get coordinates
      const coords = await getUserLocation();
      
      if (!coords) {
        console.error('Failed to get user location');
        return;
      }
      
      // Set coordinates for search
      setCoordinates(coords);
      
      // Get city and state from coordinates
      const locationInfo = await reverseGeocode(coords.lat, coords.lng);
      
      if (locationInfo) {
        const locationString = `${locationInfo.city}, ${locationInfo.state}`;
        setLocation(locationString);
        
        // Save to browser storage
        saveUserLocation({
          ...coords,
          city: locationInfo.city,
          state: locationInfo.state
        });
      }
    } catch (err) {
      console.error('Error getting location:', err);
    } finally {
      setIsLocating(false);
    }
  };
  
  // Handle selection of a clinic from suggestions
  const handleSelectClinic = (clinic: { id: string; name: string; city: string; state: string }) => {
    // Navigate directly to the clinic page
    router.push(`/clinic/${clinic.id}`);
  };
  
  // Handle selection of a service from suggestions
  const handleSelectService = (selectedService: string) => {
    setService(selectedService);
    setQuery('');
    setIsFocused(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle selection of a location from suggestions
  const handleSelectLocation = (selectedLocation: { city: string; state: string }) => {
    const locationString = `${selectedLocation.city}, ${selectedLocation.state}`;
    setLocation(locationString);
    setQuery('');
    setIsFocused(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="flex items-center bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="w-full py-3 px-4 pl-10 bg-transparent text-white focus:outline-none"
          />
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Divider */}
        {(service || location) && (
          <div className="h-6 w-px bg-gray-700 mx-2"></div>
        )}
        
        {/* Selected Service */}
        {service && (
          <div className="flex items-center bg-gray-700 rounded-lg px-3 py-1 mx-1">
            <span className="text-white text-sm">{service}</span>
            <button
              type="button"
              onClick={() => setService('')}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Selected Location */}
        {location && (
          <div className="flex items-center bg-gray-700 rounded-lg px-3 py-1 mx-1">
            <span className="text-white text-sm">{location}</span>
            <button
              type="button"
              onClick={() => {
                setLocation('');
                setCoordinates(null);
              }}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Location Button */}
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="p-3 text-gray-400 hover:text-white transition-colors"
          title="Use my location"
        >
          {isLocating ? (
            <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
        
        {/* Search Button */}
        <button
          type="submit"
          className="bg-primary hover:bg-red-600 text-white px-5 py-3 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
      
      {/* Search Suggestions */}
      <SearchSuggestions
        suggestions={suggestions}
        loading={suggestionsLoading}
        onSelectClinic={handleSelectClinic}
        onSelectService={handleSelectService}
        onSelectLocation={handleSelectLocation}
        isVisible={isFocused && query.length >= 2}
      />
    </div>
  );
};

export default SmartSearchBar;