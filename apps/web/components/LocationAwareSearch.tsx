import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SearchSuggestion {
  text: string;
  type: 'city' | 'service' | 'clinic';
  data?: any;
}

// Static fallback suggestions if Firestore fails
const FALLBACK_SUGGESTIONS: SearchSuggestion[] = [
  { text: 'TRT Clinics', type: 'service' },
  { text: 'ED Treatment', type: 'service' },
  { text: 'Hormone Therapy', type: 'service' },
  { text: 'Austin, TX', type: 'city' },
  { text: 'Dallas, TX', type: 'city' },
  { text: 'New York, NY', type: 'city' },
  { text: 'Los Angeles, CA', type: 'city' },
  { text: 'Chicago, IL', type: 'city' },
];

const LocationAwareSearch: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get user's location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      setLocationStatus('loading');
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLocationStatus('success');
            // We could fetch the nearest city name here based on coordinates
            fetchNearestCityName(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationStatus('error');
            // Fallback to IP-based location
            fetchIpBasedLocation();
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      } else {
        console.log('Geolocation not supported');
        setLocationStatus('error');
        // Fallback to IP-based location
        fetchIpBasedLocation();
      }
    };
    
    getUserLocation();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch dynamic suggestions from Firestore based on search text
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchText.trim()) {
        setSuggestions(FALLBACK_SUGGESTIONS);
        return;
      }

      try {
        // Create a compound array to hold all suggestions
        const allSuggestions: SearchSuggestion[] = [];
        const searchLower = searchText.toLowerCase().trim();
        
        // Search for services
        const servicesQuery = query(
          collection(db, 'services'),
          where('keywords', 'array-contains', searchLower),
          limit(3)
        );
        
        // Search for cities
        const citiesQuery = query(
          collection(db, 'clinics'),
          where('city', '>=', searchLower),
          where('city', '<=', searchLower + '\uf8ff'),
          limit(3)
        );
        
        // Search for clinics
        const clinicsQuery = query(
          collection(db, 'clinics'),
          where('name', '>=', searchLower),
          where('name', '<=', searchLower + '\uf8ff'),
          limit(3)
        );
        
        // Execute all queries in parallel
        const [servicesSnapshot, citiesSnapshot, clinicsSnapshot] = await Promise.all([
          getDocs(servicesQuery).catch(() => ({ docs: [] })),
          getDocs(citiesQuery).catch(() => ({ docs: [] })),
          getDocs(clinicsQuery).catch(() => ({ docs: [] }))
        ]);
        
        // Process services
        servicesSnapshot.docs.forEach(doc => {
          allSuggestions.push({
            text: doc.id,
            type: 'service',
            data: doc.data()
          });
        });
        
        // Process cities (avoid duplicates)
        const cities = new Set<string>();
        citiesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const cityState = `${data.city}, ${data.state}`;
          if (!cities.has(cityState)) {
            cities.add(cityState);
            allSuggestions.push({
              text: cityState,
              type: 'city',
              data: { city: data.city, state: data.state }
            });
          }
        });
        
        // Process clinics
        clinicsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allSuggestions.push({
            text: data.name,
            type: 'clinic',
            data: { id: doc.id, ...data }
          });
        });
        
        if (allSuggestions.length > 0) {
          setSuggestions(allSuggestions);
        } else {
          // Fallback to static suggestions if no results
          setSuggestions(FALLBACK_SUGGESTIONS);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions(FALLBACK_SUGGESTIONS);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  // Fetch city name from coordinates
  const fetchNearestCityName = async (lat: number, lng: number) => {
    try {
      // Use reverse geocoding API (Google Maps, Nominatim, etc.)
      // For development, we're using a mock implementation
      // In production, use a proper reverse geocoding service
      
      // Mock implementation - would be replaced with actual API call
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.address && data.address.city) {
          const cityState = `${data.address.city}, ${data.address.state || ''}`.trim();
          // Don't automatically set search text, just hint it
          // setSearchText(cityState);
        }
      }
    } catch (error) {
      console.error('Error fetching city name:', error);
    }
  };

  // Fallback to IP-based location
  const fetchIpBasedLocation = async () => {
    try {
      // Use an IP geolocation API
      // For development, using a free service (limited requests)
      const response = await fetch('https://ipapi.co/json/');
      
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setUserLocation({
            lat: data.latitude,
            lng: data.longitude,
          });
          setLocationStatus('success');
          
          // Don't automatically set search text, just store the location
          // This location will be used for sorting results by distance
        }
      }
    } catch (error) {
      console.error('Error fetching IP-based location:', error);
      setLocationStatus('error');
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    
    // Store search in localStorage for recent searches
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    if (!recentSearches.includes(searchText)) {
      recentSearches.unshift(searchText);
      if (recentSearches.length > 5) recentSearches.pop();
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }
    
    // Navigate to search results
    router.push({
      pathname: '/search',
      query: { 
        q: searchText,
        ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng })
      }
    });
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchText(suggestion.text);
    setShowSuggestions(false);
    
    // Navigate based on suggestion type
    if (suggestion.type === 'clinic' && suggestion.data?.slug) {
      // Direct to clinic page
      router.push(`/${suggestion.data.slug}`);
    } else if (suggestion.type === 'city' && suggestion.data) {
      // Search by city
      router.push({
        pathname: '/search',
        query: { 
          city: suggestion.data.city, 
          state: suggestion.data.state,
          ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng })
        }
      });
    } else if (suggestion.type === 'service') {
      // Search by service
      router.push({
        pathname: '/search',
        query: { 
          service: suggestion.text,
          ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng })
        }
      });
    } else {
      // Generic search
      router.push({
        pathname: '/search',
        query: { 
          q: suggestion.text,
          ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng })
        }
      });
    }
  };

  // Handle use current location button
  const handleUseCurrentLocation = () => {
    if (locationStatus === 'success' && userLocation) {
      router.push({
        pathname: '/search',
        query: { 
          lat: userLocation.lat,
          lng: userLocation.lng,
          near: 'me'
        }
      });
    } else {
      // Try again to get location
      setLocationStatus('loading');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(newLocation);
            setLocationStatus('success');
            
            // Navigate to search with location
            router.push({
              pathname: '/search',
              query: { 
                lat: newLocation.lat,
                lng: newLocation.lng,
                near: 'me'
              }
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationStatus('error');
            // Show error toast or message
          }
        );
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full px-4 py-3 pl-12 pr-16 text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="Search for men's health clinics near you..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          
          {/* Location button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full
              ${locationStatus === 'success' 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : locationStatus === 'loading'
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <MapPinIcon className={`h-5 w-5 ${locationStatus === 'loading' ? 'animate-pulse' : ''}`} />
          </button>
        </div>
        
        <button type="submit" className="hidden">Search</button>
      </form>
      
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={`${suggestion.type}-${index}`}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.type === 'city' && (
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
                  )}
                  {suggestion.type === 'service' && (
                    <span className="h-5 w-5 mr-2 flex items-center justify-center text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M3.5 2A1.5 1.5 0 002 3.5V5c0 .55.45 1 1 1h1V3.5a.5.5 0 01.5-.5h1V2h-2z" />
                        <path d="M8.5 2h2v1h-2V2z" />
                        <path d="M14.5 2H13v1h1.5a.5.5 0 01.5.5V5h1c.55 0 1-.45 1-1V3.5A1.5 1.5 0 0015.5 2h-1z" />
                        <path d="M9.5 15.5h-5A1.5 1.5 0 013 14v-1.5H2a1 1 0 01-1-1V9a1 1 0 011-1h1V6.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5z" />
                        <path d="M18 9.5V14a1.5 1.5 0 01-1.5 1.5h-5a.5.5 0 01-.5-.5v-8a.5.5 0 01.5-.5h5c.83 0 1.5.67 1.5 1.5V9h-1a1 1 0 00-1 1v2.5a1 1 0 001 1h1z" />
                      </svg>
                    </span>
                  )}
                  {suggestion.type === 'clinic' && (
                    <span className="h-5 w-5 mr-2 flex items-center justify-center text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9.5 1.25a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5zM3.5 9.5a6 6 0 1112 0 6 6 0 01-12 0z" clipRule="evenodd" />
                        <path d="M8 6.75a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5a.75.75 0 01.75-.75z" />
                      </svg>
                    </span>
                  )}
                  <span>{suggestion.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-gray-500">No suggestions found</div>
          )}
          
          {/* Recent searches */}
          {localStorage && localStorage.getItem('recentSearches') && (
            <div className="border-t border-gray-200">
              <div className="px-4 py-2 text-xs text-gray-500">Recent Searches</div>
              <ul className="pb-2">
                {JSON.parse(localStorage.getItem('recentSearches') || '[]').map((search: string, index: number) => (
                  <li 
                    key={`recent-${index}`}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => {
                      setSearchText(search);
                      setShowSuggestions(false);
                      router.push({
                        pathname: '/search',
                        query: { q: search }
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {search}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAwareSearch;