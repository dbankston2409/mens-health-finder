import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Clinic, ClinicLocation, TierCountsFlexible, ClinicFilter } from '../types';
import TierBadge from '../components/TierBadge';
import dynamic from 'next/dynamic';
import { geocodeCityState, reverseGeocode } from '../components/Map';
import { createClinicUrl } from '../components/Map';
import { getServiceSlug } from '../lib/utils';
import SearchResultsList from '../components/SearchResultsList';

// Import the clinic service
import * as clinicService from '../lib/api/clinicService';
const { searchClinics, queryClinics } = clinicService;

// Dynamic import for the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-900 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-[#AAAAAA]">Loading map components...</p>
        <p className="text-xs text-[#666666] mt-2">This may take a moment on first load</p>
      </div>
    </div>
  )
});

const SearchPage: React.FC = () => {
  const router = useRouter();
  const { q, city, state, service, location } = router.query;
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [filters, setFilters] = useState<ClinicFilter>({});
  
  // Helper function to update a specific filter
  const onFilterChange = (name: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const [results, setResults] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number; zoom: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasAttemptedAutoLocation, setHasAttemptedAutoLocation] = useState(false);
  
  // Initialize from URL query params
  useEffect(() => {
    if (q) setSearchTerm(q as string);
    if (city) setSelectedCity(city as string);
    if (state) setSelectedState(state as string);
    if (service) setSelectedService(service as string);
    if (location) setSelectedLocation(location as string);
    
    // Handle tier filter from URL if present
    if (router.query.tier) {
      const tierValue = router.query.tier as string;
      // Only set if it's one of our valid tier values
      if (['free', 'standard', 'advanced'].includes(tierValue)) {
        onFilterChange('tier', tierValue as 'free' | 'standard' | 'advanced');
      }
    }
    
    // Geocode the location if provided in URL
    if (location) {
      setLoading(true);
      const [city, state] = (location as string).split(', ');
      if (city && state) {
        geocodeAndSetCenter(city, state);
      }
    } 
    // Auto-detect location if no location is specified and not attempted before
    else if (!hasAttemptedAutoLocation && !selectedLocation) {
      setHasAttemptedAutoLocation(true);
      getUserLocation(false); // false indicates this is an automatic attempt, not manual
    }
  }, [q, city, state, service, location, router.query.tier, hasAttemptedAutoLocation]);
  
  // When filters change, update URL and perform search
  useEffect(() => {
    const newFilters: ClinicFilter = {};
    
    if (searchTerm.trim()) {
      newFilters.searchTerm = searchTerm.trim();
    }
    
    if (selectedCity) {
      newFilters.city = selectedCity;
    }
    
    if (selectedState) {
      newFilters.state = selectedState;
    }
    
    if (selectedService) {
      newFilters.services = [selectedService];
    }
    
    // Make sure to maintain any tier filters that were set via the buttons
    if (filters.tier) {
      newFilters.tier = filters.tier;
    }
    
    setFilters(newFilters);
    
    // Only update the URL if we came from a form submission
    // to avoid an infinite loop
    if (Object.keys(router.query).length > 0) {
      const queryParams = new URLSearchParams();
      
      if (searchTerm) queryParams.set('q', searchTerm);
      if (selectedCity) queryParams.set('city', selectedCity);
      if (selectedState) queryParams.set('state', selectedState);
      if (selectedService) queryParams.set('service', selectedService);
      if (selectedLocation) queryParams.set('location', selectedLocation);
      if (filters.tier) queryParams.set('tier', filters.tier);
      
      const queryString = queryParams.toString();
      
      router.push(`/search?${queryString}`, undefined, { shallow: true });
    }
  }, [searchTerm, selectedCity, selectedState, selectedService, selectedLocation, filters.tier]);
  
  // Perform search when filters change
  useEffect(() => {
    const performSearch = async () => {
      if (Object.keys(filters).length === 0) {
        // Don't search if no filters
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        let results: Clinic[];
        
        // If we have a search term, use the search function
        if (filters.searchTerm) {
          results = await searchClinics(filters.searchTerm);
        } else {
          // Otherwise use the query function with filters
          const queryResult = await queryClinics(filters);
          results = queryResult.clinics;
        }
        
        // Store the search query for later
        localStorage.setItem('lastSearchQuery', filters.searchTerm || '');
        
        setResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    performSearch();
  }, [filters]);
  
  // Geocode the city/state and set map center
  const geocodeAndSetCenter = async (city: string, state: string) => {
    try {
      // Only attempt geocoding on the client side
      if (typeof window !== 'undefined') {
        const coords = await geocodeCityState(city, state);
        if (coords) {
          setMapCenter(coords);
        }
      } else {
        // Default center for server-side rendering
        setMapCenter({
          lat: 39.8283,
          lng: -98.5795,
          zoom: 4
        });
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get user's current location
  const getUserLocation = (manualTrigger = false) => {
    setIsLocating(true);
    setLocationError(null);
    
    // If this was triggered by a button click (not auto-detect), 
    // reset the hasAttemptedAutoLocation flag to allow future auto-detection attempts
    if (manualTrigger) {
      setHasAttemptedAutoLocation(false);
    }
    
    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }
    
    // Create a timeout that will trigger if geolocation takes too long
    const timeoutId = setTimeout(() => {
      console.log("Geolocation request taking longer than expected, showing loading indicator...");
      // We don't fail here, but inform the user it's taking longer
      setLocationError("Determining your location... This may take a few moments.");
    }, 3000);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Clear the timeout since we got a position
          clearTimeout(timeoutId);
          
          // Get latitude and longitude
          const { latitude, longitude } = position.coords;
          console.log("Got user coordinates:", latitude, longitude);
          
          // Use reverse geocoding to get city and state
          const locationInfo = await reverseGeocode(latitude, longitude);
          
          if (locationInfo) {
            // Format as "City, State"
            const locationString = `${locationInfo.city}, ${locationInfo.state}`;
            console.log("Successfully determined location:", locationString);
            
            // Update filters with the new location
            setSelectedLocation(locationString);
            
            // Set map center
            setMapCenter({
              lat: latitude,
              lng: longitude,
              zoom: 12
            });
            
            // Clear any error message since we succeeded
            setLocationError(null);
          } else {
            console.error("Reverse geocoding returned null");
            setLocationError("Could not determine your location. Please select from the list.");
          }
        } catch (error) {
          console.error("Error processing location:", error);
          setLocationError("Failed to get your location. Please select from the list.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        // Clear the timeout since we got an error response
        clearTimeout(timeoutId);
        
        console.error("Geolocation error:", error);
        
        let errorMessage = "Failed to get your location.";
        if (error.code === 1) {
          // Permission denied
          errorMessage = "Location access denied. Please check your browser settings to enable location access, or select from the list.";
        } else if (error.code === 2) {
          // Position unavailable
          errorMessage = "Your location is currently unavailable. Please select from the list.";
        } else if (error.code === 3) {
          // Timeout
          errorMessage = "Location request timed out. Please try again or select from the list.";
        }
        
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000,  // Increased to 15 seconds
        maximumAge: 300000 // 5 minutes
      }
    );
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the URL and trigger the search
    const queryParams = new URLSearchParams();
    
    if (searchTerm) queryParams.set('q', searchTerm);
    if (selectedCity) queryParams.set('city', selectedCity);
    if (selectedState) queryParams.set('state', selectedState);
    if (selectedService) queryParams.set('service', selectedService);
    if (selectedLocation) queryParams.set('location', selectedLocation);
    
    const queryString = queryParams.toString();
    
    router.push(`/search?${queryString}`);
  };
  
  // Get standardized tier from package
  const getTierFromPackage = (pkg: string): 'free' | 'standard' | 'advanced' => {
    switch (pkg) {
      case 'premium':
        return 'advanced';
      case 'basic':
        return 'standard';
      default:
        return 'free';
    }
  };
  
  // Sort clinics by tier (advanced first, then standard, then free)
  const sortedResults = [...results].sort((a, b) => {
    const tierOrder: Record<string, number> = { 
      'premium': 0, 'advanced': 0, 'high': 0, 
      'basic': 1, 'standard': 1, 'low': 1, 
      'free': 2 
    };
    return (tierOrder[a.package || a.tier || 'free'] || 2) - (tierOrder[b.package || b.tier || 'free'] || 2);
  });
  
  return (
    <>
      <Head>
        <title>Search Men's Health Clinics | Men's Health Finder</title>
        <meta name="description" content="Find men's health clinics near you that specialize in TRT, ED treatment, and other men's health services." />
      </Head>
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <div className="lg:w-1/4">
              <div className="glass-card sticky top-8 overflow-visible group">
                {/* Card inner content */}
                <div className="p-6 relative z-10">
                  {/* Header with accent line */}
                  <div className="relative mb-6">
                    <h2 className="text-xl font-bold">Refine Results</h2>
                    <div className="absolute left-0 bottom-[-8px] w-12 h-[3px] bg-gradient-to-r from-primary to-red-400 rounded-full"></div>
                  </div>
                  
                  {/* Filter sections */}
                  <div className="space-y-5">
                    {/* Location filter */}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-sm text-white font-medium mb-2 ml-1">Location</label>
                        <button 
                          type="button" 
                          className="text-xs text-primary hover:text-red-400 transition-colors mb-2 flex items-center gap-1"
                          onClick={() => getUserLocation(true)}
                          disabled={isLocating}
                        >
                          {isLocating ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                              </svg>
                              <span>Use my location</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <select 
                          className="input pl-10 transition-all border-[#333333] focus:border-primary"
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                          <option value="">All Locations</option>
                          <optgroup label="Popular Locations">
                            <option value="Austin, TX">Austin, TX</option>
                            <option value="Dallas, TX">Dallas, TX</option>
                            <option value="Houston, TX">Houston, TX</option>
                            <option value="San Antonio, TX">San Antonio, TX</option>
                            <option value="Fort Worth, TX">Fort Worth, TX</option>
                          </optgroup>
                          <optgroup label="California">
                            <option value="Los Angeles, CA">Los Angeles, CA</option>
                            <option value="San Diego, CA">San Diego, CA</option>
                            <option value="San Francisco, CA">San Francisco, CA</option>
                            <option value="Temecula, CA">Temecula, CA</option>
                          </optgroup>
                          <optgroup label="Other Major Cities">
                            <option value="New York, NY">New York, NY</option>
                            <option value="Chicago, IL">Chicago, IL</option>
                            <option value="Miami, FL">Miami, FL</option>
                            <option value="Phoenix, AZ">Phoenix, AZ</option>
                            <option value="Denver, CO">Denver, CO</option>
                          </optgroup>
                        </select>
                        <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#777777]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      {locationError && (
                        <div className="mt-1 ml-1">
                          <p className={`text-xs ${locationError.includes("Determining") ? "text-blue-400" : "text-red-400"}`}>{locationError}</p>
                          {locationError.includes("Failed") && (
                            <p className="text-xs text-gray-400 mt-1">
                              Try selecting a popular location below:
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Treatment filter */}
                    <div>
                      <label className="block text-sm text-white font-medium mb-2 ml-1">Treatment</label>
                      <div className="relative">
                        <select 
                          className="input pl-10 transition-all border-[#333333] focus:border-primary"
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                        >
                          <option value="">All Services</option>
                          <option value="TRT">Testosterone Replacement</option>
                          <option value="ED Treatment">ED Treatment</option>
                          <option value="Hair Loss">Hair Loss</option>
                          <option value="Weight Loss">Weight Loss</option>
                          <option value="Peptide Therapy">Peptide Therapy</option>
                          <option value="IV Therapy">IV Therapy</option>
                          <option value="Cryotherapy">Cryotherapy</option>
                        </select>
                        <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#777777]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Search term */}
                    <div>
                      <label className="block text-sm text-white font-medium mb-2 ml-1">Search</label>
                      <form onSubmit={handleSearch} className="relative">
                        <input
                          type="text"
                          className="input pl-10 transition-all border-[#333333] focus:border-primary w-full"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search by name or keyword..."
                        />
                        <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#777777]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <button 
                          type="submit" 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#777777] hover:text-white"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </form>
                    </div>
                    
                    {/* Tier filter */}
                    <div>
                      <label className="block text-sm text-white font-medium mb-2 ml-1">Tier</label>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${!filters.tier ? 'bg-primary text-white' : 'bg-[#222] text-[#AAA] hover:bg-[#333]'}`}
                          onClick={() => onFilterChange('tier', undefined)}
                        >
                          All
                        </button>
                        <button 
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${filters.tier === 'advanced' ? 'bg-primary text-white' : 'bg-[#222] text-[#AAA] hover:bg-[#333]'}`}
                          onClick={() => onFilterChange('tier', 'advanced')}
                        >
                          Advanced
                        </button>
                        <button 
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${filters.tier === 'standard' ? 'bg-yellow-600 text-white' : 'bg-[#222] text-[#AAA] hover:bg-[#333]'}`}
                          onClick={() => onFilterChange('tier', 'standard')}
                        >
                          Standard
                        </button>
                        <button 
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${filters.tier === 'free' ? 'bg-gray-600 text-white' : 'bg-[#222] text-[#AAA] hover:bg-[#333]'}`}
                          onClick={() => onFilterChange('tier', 'free')}
                        >
                          Free
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="my-6 border-t border-[#333]"></div>
                  
                  {/* Clear Filters Button */}
                  <button 
                    className="btn-secondary w-full group relative overflow-hidden"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCity('');
                      setSelectedState('');
                      setSelectedService('');
                      setSelectedLocation('');
                      onFilterChange('tier', undefined); // Clear tier filter
                      setFilters({});
                      setMapCenter(null);
                      // Update the URL to remove query parameters
                      router.push('/search', undefined, { shallow: true });
                    }}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#333] to-[#444] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span className="relative flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All Filters
                    </span>
                  </button>
                </div>
                
                {/* Background glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 -z-10"></div>
              </div>
            </div>
            
            {/* Results */}
            <div className="lg:w-3/4">
              <h1 className="text-3xl font-bold mb-6">
                {selectedLocation ? `Men's Health Clinics in ${selectedLocation}` : 
                 (selectedCity && selectedState) ? `Men's Health Clinics in ${selectedCity}, ${selectedState}` :
                 selectedState ? `Men's Health Clinics in ${selectedState}` :
                 "Men's Health Clinics"}
                {selectedService ? ` - ${selectedService}` : ''}
                {searchTerm ? ` - "${searchTerm}"` : ''}
              </h1>
              
              {/* Map View */}
              <div className="mb-8">
                <Map 
                  locations={sortedResults.map(clinic => ({
                    id: parseInt(clinic.id || '0', 10),
                    name: clinic.name,
                    address: clinic.address,
                    city: clinic.city,
                    state: clinic.state,
                    lat: clinic.lat || 0,
                    lng: clinic.lng || 0,
                    tier: clinic.tier || getTierFromPackage(clinic.package || ''),
                    rating: 4.5, // Placeholder since we don't have this field yet
                    phone: clinic.phone
                  }))}
                  center={mapCenter || undefined}
                  height="400px"
                />
              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Searching for clinics...</p>
                </div>
              )}
              
              {/* Error State */}
              {error && !loading && (
                <div className="py-8 text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button 
                    onClick={() => setFilters({})} 
                    className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
                  >
                    Reset Search
                  </button>
                </div>
              )}
              
              {/* No Results State */}
              {!loading && !error && sortedResults.length === 0 && Object.keys(filters).length > 0 && (
                <div className="py-8 text-center">
                  <p className="mb-4">No clinics found matching your search criteria.</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCity('');
                      setSelectedState('');
                      setSelectedService('');
                      setSelectedLocation('');
                      setFilters({});
                    }} 
                    className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
                  >
                    Reset Search
                  </button>
                </div>
              )}
              
              {/* Result stats */}
              {!loading && sortedResults.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                  <p className="text-textSecondary">
                    Found {sortedResults.length} clinics 
                    {selectedLocation ? ` in ${selectedLocation}` : 
                     (selectedCity && selectedState) ? ` in ${selectedCity}, ${selectedState}` :
                     selectedState ? ` in ${selectedState}` : ''}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                    <span className="text-sm text-textSecondary">Browse by category:</span>
                    <Link 
                      href={`/${getServiceSlug('trt')}`}
                      className="text-sm text-primary hover:text-red-400 transition-colors"
                    >
                      TRT
                    </Link>
                    <Link 
                      href={`/${getServiceSlug('ed')}`}
                      className="text-sm text-primary hover:text-red-400 transition-colors"
                    >
                      ED Treatment
                    </Link>
                    <Link 
                      href={`/${getServiceSlug('hairloss')}`}
                      className="text-sm text-primary hover:text-red-400 transition-colors"
                    >
                      Hair Loss
                    </Link>
                    <Link 
                      href={`/${getServiceSlug('weightloss')}`}
                      className="text-sm text-primary hover:text-red-400 transition-colors"
                    >
                      Weight Loss
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Results list - Replace with new component */}
              <SearchResultsList 
                initialFilters={filters} 
                userLocation={mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng } : null}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

// The actual onFilterChange function is implemented inside the component
// This is just to prevent TypeScript errors for the function referenced in JSX

export default SearchPage;