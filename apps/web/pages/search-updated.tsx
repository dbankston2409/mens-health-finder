import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Import components
import MapSearchBar from '../components/MapSearchBar';
import FilterBar from '../components/FilterBar';
import ClinicCard from '../components/ClinicCard';
import MobileMapToggle from '../components/MobileMapToggle';
import LocationPromptModal from '../components/LocationPromptModal';
import useGeoSearch, { useUserLocation } from '../utils/hooks/useGeoSearch';

// Import types
import { Clinic, ExtendedClinic, ClinicLocation, TierCountsFlexible, safeObjectAccess } from '../types';
import { ClinicFilter } from '../lib/api/clinicService';

// Import either the real service or the mock service based on environment
import * as realClinicService from '../lib/api/clinicService';
import * as mockClinicService from '../lib/api/mockClinicService';

// Use mock service in development mode, real service in production
const clinicService = process.env.NODE_ENV === 'development' 
  ? mockClinicService 
  : realClinicService;

const { searchClinics, queryClinics } = clinicService;

// Dynamic import for the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-900 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-[#AAAAAA]">Loading map...</p>
      </div>
    </div>
  )
});

interface ExtendedClinic extends Clinic {
  distance?: number;
}

const SearchPage: React.FC = () => {
  const router = useRouter();
  const { service, location, q } = router.query;
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filters, setFilters] = useState({
    services: [] as string[],
    tiers: [] as string[],
    states: [] as string[],
    verifiedOnly: false
  });
  
  // Results and UI state
  const [results, setResults] = useState<ExtendedClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'tier'>('distance');
  
  // Location state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number; zoom: number} | null>(null);
  
  // Geo search hook
  const {
    clinics: nearbyClinics,
    loading: geoLoading,
    error: geoError,
    totalWithinRadius,
    refresh: refreshGeoSearch
  } = useGeoSearch({
    latitude: userLocation?.lat || 39.8283,
    longitude: userLocation?.lng || -98.5795,
    radius: 50,
    serviceFilter: service as string,
    tierFilter: filters.tiers
  });

  // Initialize from URL parameters
  useEffect(() => {
    if (service) {
      setFilters(prev => ({ ...prev, services: [service as string] }));
    }
    if (location) {
      setLocationQuery(location as string);
      geocodeLocation(location as string);
    }
    if (q) {
      setSearchQuery(q as string);
    }
  }, [service, location, q]);

  // Check for location permission on mount
  useEffect(() => {
    const hasAskedForLocation = localStorage.getItem('hasAskedForLocation');
    const locationDenied = localStorage.getItem('locationPermissionDenied');
    const savedLocation = sessionStorage.getItem('userLocation');
    
    if (savedLocation) {
      const locationData = JSON.parse(savedLocation);
      setUserLocation({ lat: locationData.lat, lng: locationData.lng });
      setMapCenter({ lat: locationData.lat, lng: locationData.lng, zoom: 12 });
    } else if (!hasAskedForLocation && !locationDenied) {
      setShowLocationModal(true);
    }
  }, []);

  // Perform search when filters change
  useEffect(() => {
    performSearch();
  }, [filters, searchQuery, locationQuery]);

  const geocodeLocation = async (locationString: string) => {
    try {
      const [city, state] = locationString.split(', ');
      if (!city || !state) return;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&city=${city}&state=${state}&countrycodes=us&limit=1`,
        { headers: { 'User-Agent': 'MensHealthFinder/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          const coords = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            zoom: 12
          };
          setMapCenter(coords);
          setUserLocation({ lat: coords.lat, lng: coords.lng });
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      let searchResults: Clinic[] = [];

      if (searchQuery.trim()) {
        searchResults = await searchClinics(searchQuery);
      } else {
        const clinicFilter: ClinicFilter = {};
        
        if (filters.services.length > 0) {
          clinicFilter.services = filters.services;
        }
        if (filters.tiers.length > 0) {
          clinicFilter.package = filters.tiers[0]; // Assuming single tier for now
        }
        if (locationQuery) {
          const [city, state] = locationQuery.split(', ');
          if (city) clinicFilter.city = city;
          if (state) clinicFilter.state = state;
        }

        const queryResult = await queryClinics(clinicFilter);
        searchResults = queryResult.clinics;
      }

      // Add distance if we have user location
      let resultsWithDistance: ExtendedClinic[] = searchResults;
      if (userLocation && searchResults.length > 0) {
        resultsWithDistance = searchResults.map(clinic => {
          if (clinic.lat && clinic.lng) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              clinic.lat,
              clinic.lng
            );
            return { ...clinic, distance };
          }
          return clinic;
        });
      }

      // Apply additional filters
      let filteredResults = resultsWithDistance;
      
      if (filters.verifiedOnly) {
        filteredResults = filteredResults.filter(clinic => clinic.verified);
      }

      if (filters.states.length > 0) {
        filteredResults = filteredResults.filter(clinic => 
          filters.states.includes(clinic.state)
        );
      }

      // Sort results
      sortResults(filteredResults, sortBy);

      setResults(filteredResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search clinics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortResults = (results: ExtendedClinic[], sortType: string) => {
    switch (sortType) {
      case 'distance':
        results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        break;
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'tier':
        const tierOrder: Record<string, number> = { 'premium': 0, 'basic': 1, 'free': 2, 'high': 0, 'low': 1 };
        results.sort((a, b) => tierOrder[a.package || a.tier || 'free'] - tierOrder[b.package || b.tier || 'free']);
        break;
    }
  };

  const handleLocationAccepted = (location: any) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    setMapCenter({ lat: location.lat, lng: location.lng, zoom: 12 });
    
    if (location.city && location.state) {
      setLocationQuery(`${location.city}, ${location.state}`);
    }
  };

  const handleLocationDenied = () => {
    // Use default US center
    setMapCenter({ lat: 39.8283, lng: -98.5795, zoom: 4 });
  };

  const getTierFromPackage = (pkg: string): 'free' | 'low' | 'high' => {
    switch (pkg) {
      case 'premium': return 'high';
      case 'basic': return 'low';
      default: return 'free';
    }
  };

  // Convert results to map format
  const mapLocations = results.map(clinic => ({
    id: clinic.id || '0',
    name: clinic.name,
    address: clinic.address,
    city: clinic.city,
    state: clinic.state,
    lat: clinic.lat || 0,
    lng: clinic.lng || 0,
    tier: getTierFromPackage(clinic.package),
    rating: clinic.rating,
    phone: clinic.phone
  }));

  return (
    <>
      <Head>
        <title>
          {service ? `${service} Clinics` : 'Men\'s Health Clinics'} 
          {location ? ` in ${location}` : ''} | Men's Health Finder
        </title>
        <meta 
          name="description" 
          content={`Find specialized men's health clinics ${location ? `in ${location}` : 'near you'} for ${service || 'TRT, ED treatment, and more'}.`} 
        />
      </Head>

      <main className="min-h-screen bg-gray-900">
        {/* Search Bar */}
        <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4">
            <MapSearchBar
              defaultService={service as string || ''}
              defaultLocation={location as string || ''}
              onSearch={(searchService, searchLocation) => {
                const queryParams = new URLSearchParams();
                if (searchService) queryParams.set('service', searchService);
                if (searchLocation) queryParams.set('location', searchLocation);
                router.push(`/search?${queryParams.toString()}`);
              }}
            />
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          totalResults={results.length}
          isSticky={true}
        />

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {service ? `${service} Clinics` : 'Men\'s Health Clinics'}
              {location && ` in ${location}`}
            </h1>
            <p className="text-gray-400">
              {loading ? 'Searching...' : `${results.length} clinics found`}
              {userLocation && ` • Sorted by distance`}
            </p>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  const sortedResults = [...results];
                  sortResults(sortedResults, e.target.value);
                  setResults(sortedResults);
                }}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="tier">Tier</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-4 text-gray-400">Searching for clinics...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-red-400 font-medium">Search Error</h3>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No clinics found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search criteria or location.</p>
              <button
                onClick={() => {
                  setFilters({ services: [], tiers: [], states: [], verifiedOnly: false });
                  setSearchQuery('');
                  setLocationQuery('');
                }}
                className="px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <MobileMapToggle
              showMap={showMobileMap}
              onToggle={setShowMobileMap}
              clinicCount={results.length}
              mapComponent={
                <div className="h-96 lg:h-[600px] rounded-xl overflow-hidden">
                  <Map
                    locations={mapLocations}
                    center={mapCenter || undefined}
                    height="100%"
                  />
                </div>
              }
              listComponent={
                <div className="space-y-4">
                  {results.map((clinic) => (
                    <ClinicCard
                      key={clinic.id}
                      clinic={{
                        id: clinic.id || '',
                        name: clinic.name,
                        address: clinic.address,
                        city: clinic.city,
                        state: clinic.state,
                        services: clinic.services,
                        tier: getTierFromPackage(clinic.package),
                        phone: clinic.phone,
                        website: clinic.website,
                        rating: clinic.rating,
                        distance: clinic.distance,
                        verified: clinic.verified
                      }}
                      showDistance={!!userLocation}
                    />
                  ))}
                </div>
              }
            />
          )}
        </div>

        {/* Location Prompt Modal */}
        <LocationPromptModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationAccepted={handleLocationAccepted}
          onLocationDenied={handleLocationDenied}
        />
      </main>
    </>
  );
};

export default SearchPage;