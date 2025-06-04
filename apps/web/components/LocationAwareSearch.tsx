import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAutoLocation } from '../hooks/useAutoLocation';
import ChangeLocationModal from './ChangeLocationModal';

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
  { text: 'Chicago, IL', type: 'city' }
];

const LocationAwareSearch: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Use the new auto-location hook
  const { location, isLoading, error, setLocation } = useAutoLocation();

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
    
    // Navigate to search results with auto-detected location
    router.push({
      pathname: '/search',
      query: { 
        q: searchText,
        ...(location && { 
          lat: location.lat, 
          lng: location.lng,
          city: location.city,
          state: location.stateCode
        })
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
          ...(location && { lat: location.lat, lng: location.lng })
        }
      });
    } else if (suggestion.type === 'service') {
      // Search by service
      router.push({
        pathname: '/search',
        query: { 
          service: suggestion.text,
          ...(location && { 
            lat: location.lat, 
            lng: location.lng,
            city: location.city,
            state: location.stateCode
          })
        }
      });
    } else {
      // Generic search
      router.push({
        pathname: '/search',
        query: { 
          q: suggestion.text,
          ...(location && { 
            lat: location.lat, 
            lng: location.lng,
            city: location.city,
            state: location.stateCode
          })
        }
      });
    }
  };

  // Handle near me search
  const handleNearMeSearch = () => {
    if (location) {
      router.push({
        pathname: '/search',
        query: { 
          lat: location.lat,
          lng: location.lng,
          city: location.city,
          state: location.stateCode,
          near: 'me'
        }
      });
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Location indicator above search */}
      <div className="mb-2 text-sm text-gray-600 flex items-center justify-center">
        {error ? (
          <span className="text-red-600">Service only available in the US</span>
        ) : isLoading ? (
          <span className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1 animate-pulse" />
            Detecting location...
          </span>
        ) : location ? (
          <span className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            Showing results near {location.city}, {location.stateCode}
            <button
              onClick={() => setShowLocationModal(true)}
              className="ml-2 text-blue-600 hover:underline"
            >
              Change
            </button>
          </span>
        ) : (
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center text-blue-600 hover:underline"
          >
            <MapPinIcon className="h-4 w-4 mr-1" />
            Set your location
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full px-4 py-3 pl-12 pr-4 text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="Search for men's health clinics..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
        </div>
        
        <button type="submit" className="hidden">Search</button>
      </form>
      
      {/* Quick action button */}
      {location && (
        <div className="mt-3 text-center">
          <button
            onClick={handleNearMeSearch}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            <MapPinIcon className="h-4 w-4 mr-2" />
            Find clinics near me
          </button>
        </div>
      )}
      
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
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-gray-800"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.type === 'city' && (
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
                  )}
                  {suggestion.type === 'service' && (
                    <span className="h-5 w-5 mr-2 flex items-center justify-center text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M11 3a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 7.586V3z" />
                        <path d="M4 9a1 1 0 011-1h2a1 1 0 110 2H5a1 1 0 01-1-1z" />
                        <path d="M13 9a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                        <path d="M4 14a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
                      </svg>
                    </span>
                  )}
                  {suggestion.type === 'clinic' && (
                    <span className="h-5 w-5 mr-2 flex items-center justify-center text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M6 3a1 1 0 011-1h6a1 1 0 011 1v1h3a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h3V3z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M4 8h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8zm3 3a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 011 1v1a1 1 0 01-1 1H8a1 1 0 01-1-1v-1a1 1 0 011-1v-1z" clipRule="evenodd" />
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
          {typeof window !== 'undefined' && localStorage.getItem('recentSearches') && (
            <div className="border-t border-gray-200">
              <div className="px-4 py-2 text-xs text-gray-500">Recent Searches</div>
              <ul className="pb-2">
                {JSON.parse(localStorage.getItem('recentSearches') || '[]').map((search: string, index: number) => (
                  <li 
                    key={`recent-${index}`}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-gray-800"
                    onClick={() => {
                      setSearchText(search);
                      setShowSuggestions(false);
                      router.push({
                        pathname: '/search',
                        query: { 
                          q: search,
                          ...(location && { 
                            lat: location.lat, 
                            lng: location.lng,
                            city: location.city,
                            state: location.stateCode
                          })
                        }
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
      
      {/* Change Location Modal */}
      <ChangeLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={(newLocation) => {
          setLocation(newLocation);
          setShowLocationModal(false);
        }}
        currentLocation={location}
      />
    </div>
  );
};

export default LocationAwareSearch;