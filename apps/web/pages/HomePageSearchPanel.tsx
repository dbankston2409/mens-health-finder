import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import MapSearchBar from '../components/MapSearchBar';
import LocationPromptModal from '../components/LocationPromptModal';

interface CityStats {
  slug: string;
  city: string;
  state: string;
  stateCode: string;
  clinicCount: number;
  premiumCount: number;
  enhancedCount: number;
  freeCount: number;
  topServices: string[];
}

interface HomePageSearchPanelProps {
  className?: string;
}

const POPULAR_SERVICES = [
  { id: 'trt', name: 'TRT', emoji: '💉', description: 'Testosterone Replacement' },
  { id: 'ed-treatment', name: 'ED Treatment', emoji: '⚡', description: 'Erectile Dysfunction' },
  { id: 'hair-loss', name: 'Hair Loss', emoji: '💇‍♂️', description: 'Hair Restoration' },
  { id: 'weight-loss', name: 'Weight Loss', emoji: '⚖️', description: 'Weight Management' },
  { id: 'peptide-therapy', name: 'Peptide Therapy', emoji: '🧬', description: 'Peptide Injections' },
  { id: 'iv-therapy', name: 'IV Therapy', emoji: '💧', description: 'IV Hydration' }];

// Mock data - in production this would come from Firestore
const MOCK_CITY_STATS: CityStats[] = [
  {
    slug: 'austin-tx',
    city: 'Austin',
    state: 'Texas',
    stateCode: 'TX',
    clinicCount: 17,
    premiumCount: 5,
    enhancedCount: 7,
    freeCount: 5,
    topServices: ['TRT', 'ED Treatment', 'Weight Loss']
  },
  {
    slug: 'dallas-tx',
    city: 'Dallas',
    state: 'Texas',
    stateCode: 'TX',
    clinicCount: 23,
    premiumCount: 8,
    enhancedCount: 9,
    freeCount: 6,
    topServices: ['TRT', 'Hair Loss', 'ED Treatment']
  },
  {
    slug: 'houston-tx',
    city: 'Houston',
    state: 'Texas',
    stateCode: 'TX',
    clinicCount: 19,
    premiumCount: 6,
    enhancedCount: 8,
    freeCount: 5,
    topServices: ['TRT', 'Peptide Therapy', 'Weight Loss']
  },
  {
    slug: 'los-angeles-ca',
    city: 'Los Angeles',
    state: 'California',
    stateCode: 'CA',
    clinicCount: 31,
    premiumCount: 12,
    enhancedCount: 11,
    freeCount: 8,
    topServices: ['TRT', 'ED Treatment', 'IV Therapy']
  },
  {
    slug: 'san-diego-ca',
    city: 'San Diego',
    state: 'California',
    stateCode: 'CA',
    clinicCount: 15,
    premiumCount: 4,
    enhancedCount: 6,
    freeCount: 5,
    topServices: ['TRT', 'Hair Loss', 'Wellness']
  },
  {
    slug: 'miami-fl',
    city: 'Miami',
    state: 'Florida',
    stateCode: 'FL',
    clinicCount: 14,
    premiumCount: 5,
    enhancedCount: 5,
    freeCount: 4,
    topServices: ['TRT', 'ED Treatment', 'Peptide Therapy']
  }
];

const RECENT_SEARCHES = [
  'TRT Austin',
  'ED Treatment Dallas',
  'Hair Loss Los Angeles',
  'Weight Loss Houston',
  'Peptide Therapy Miami'
];

const HomePageSearchPanel: React.FC<HomePageSearchPanelProps> = ({
  className = ''
}) => {
  const router = useRouter();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{city?: string; state?: string} | null>(null);
  const [cityStats, setCityStats] = useState<CityStats[]>(MOCK_CITY_STATS);

  useEffect(() => {
    // Check for saved location
    const savedLocation = sessionStorage.getItem('userLocation');
    if (savedLocation) {
      const locationData = JSON.parse(savedLocation);
      if (locationData.city && locationData.state) {
        setUserLocation({ city: locationData.city, state: locationData.state });
      }
    }

    // Load city stats from API in production
    // fetchCityStats();
  }, []);

  const handleLocationAccepted = (location: any) => {
    if (location.city && location.state) {
      setUserLocation({ city: location.city, state: location.state });
    }
  };

  const handleServiceClick = (service: any) => {
    const location = userLocation ? `${userLocation.city}, ${userLocation.state}` : '';
    const query = new URLSearchParams();
    query.set('service', service.name);
    if (location) query.set('location', location);
    
    router.push(`/search?${query.toString()}`);
  };

  const handleCityClick = (city: CityStats) => {
    router.push(`/search?location=${city.city}, ${city.stateCode}`);
  };

  const handleRecentSearchClick = (search: string) => {
    router.push(`/search?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className={`${className}`}>
      {/* Hero Search Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Find Specialized <span className="text-gradient">Men's Health</span> Clinics Near You
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
          Connect with top specialists offering testosterone therapy, ED treatment, 
          hair loss solutions, and comprehensive men's wellness services.
        </p>

        {/* Location Prompt Button */}
        {!userLocation && (
          <button
            onClick={() => setShowLocationModal(true)}
            className="mb-8 px-6 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>Find clinics near you</span>
          </button>
        )}

        {userLocation && (
          <div className="mb-8 flex items-center justify-center gap-2 text-green-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Showing results for {userLocation.city}, {userLocation.state}</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-12">
        <MapSearchBar
          defaultLocation={userLocation ? `${userLocation.city}, ${userLocation.state}` : ''}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Popular Services */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Popular Treatments
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service)}
              className="p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-200 text-center group"
            >
              <div className="text-3xl mb-2">{service.emoji}</div>
              <div className="text-white font-medium group-hover:text-primary transition-colors">
                {service.name}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {service.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Top Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Popular Cities */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Top Cities
          </h3>
          <div className="space-y-3">
            {cityStats.slice(0, 6).map((city) => (
              <button
                key={city.slug}
                onClick={() => handleCityClick(city)}
                className="w-full p-4 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600 rounded-lg transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium group-hover:text-primary transition-colors">
                      {city.city}, {city.stateCode}
                    </div>
                    <div className="text-sm text-gray-400">
                      {city.clinicCount} clinics • {city.topServices.slice(0, 2).join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {city.premiumCount > 0 && (
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                        {city.premiumCount} Premium
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches & Quick Links */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Trending Searches
          </h3>
          <div className="space-y-3 mb-8">
            {RECENT_SEARCHES.map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(search)}
                className="w-full p-3 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600 rounded-lg transition-all duration-200 text-left group flex items-center justify-between"
              >
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  {search}
                </span>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-primary/10 to-red-500/5 border border-primary/20 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Platform Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-400">Verified Clinics</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-gray-400">Cities Covered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">25k+</div>
                <div className="text-sm text-gray-400">Patient Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-sm text-gray-400">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Prompt Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationAccepted={handleLocationAccepted}
        onLocationDenied={() => {}}
      />
    </div>
  );
};

export default HomePageSearchPanel;