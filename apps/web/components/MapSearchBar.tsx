import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

interface MapSearchBarProps {
  onSearch?: (service: string, location: string) => void;
  defaultService?: string;
  defaultLocation?: string;
  className?: string;
}

interface ServiceSuggestion {
  id: string;
  name: string;
  description: string;
}

interface LocationSuggestion {
  id: string;
  name: string;
  type: 'city' | 'state' | 'zip';
}

const SERVICES: ServiceSuggestion[] = [
  { id: 'trt', name: 'TRT', description: 'Testosterone Replacement Therapy' },
  { id: 'ed-treatment', name: 'ED Treatment', description: 'Erectile Dysfunction Treatment' },
  { id: 'hair-loss', name: 'Hair Loss', description: 'Hair Restoration & Prevention' },
  { id: 'weight-loss', name: 'Weight Loss', description: 'Medical Weight Management' },
  { id: 'peptide-therapy', name: 'Peptide Therapy', description: 'Peptide Injections & Treatment' },
  { id: 'iv-therapy', name: 'IV Therapy', description: 'IV Hydration & Nutrients' },
  { id: 'hormone-therapy', name: 'Hormone Therapy', description: 'Hormone Optimization' },
  { id: 'wellness', name: 'Wellness', description: 'Preventive Men\'s Health' }];

const POPULAR_LOCATIONS: LocationSuggestion[] = [
  { id: 'austin-tx', name: 'Austin, TX', type: 'city' },
  { id: 'dallas-tx', name: 'Dallas, TX', type: 'city' },
  { id: 'houston-tx', name: 'Houston, TX', type: 'city' },
  { id: 'san-antonio-tx', name: 'San Antonio, TX', type: 'city' },
  { id: 'los-angeles-ca', name: 'Los Angeles, CA', type: 'city' },
  { id: 'san-diego-ca', name: 'San Diego, CA', type: 'city' },
  { id: 'miami-fl', name: 'Miami, FL', type: 'city' },
  { id: 'phoenix-az', name: 'Phoenix, AZ', type: 'city' },
  { id: 'denver-co', name: 'Denver, CO', type: 'city' },
  { id: 'new-york-ny', name: 'New York, NY', type: 'city' },
  { id: 'chicago-il', name: 'Chicago, IL', type: 'city' },
  { id: 'atlanta-ga', name: 'Atlanta, GA', type: 'city' }];

const MapSearchBar: React.FC<MapSearchBarProps> = ({
  onSearch,
  defaultService = '',
  defaultLocation = '',
  className = ''
}) => {
  const router = useRouter();
  const [service, setService] = useState(defaultService);
  const [location, setLocation] = useState(defaultLocation);
  const [serviceFocused, setServiceFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  
  const serviceInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const filteredServices = SERVICES.filter(s => 
    s.name.toLowerCase().includes(service.toLowerCase()) ||
    s.description.toLowerCase().includes(service.toLowerCase())
  );

  const filteredLocations = POPULAR_LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(location.toLowerCase())
  );

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node) &&
          !serviceInputRef.current?.contains(event.target as Node)) {
        setServiceFocused(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node) &&
          !locationInputRef.current?.contains(event.target as Node)) {
        setLocationFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSearch) {
      onSearch(service, location);
    } else {
      // Default behavior: navigate to search page
      const queryParams = new URLSearchParams();
      if (service) queryParams.set('service', service);
      if (location) queryParams.set('location', location);
      
      router.push(`/search?${queryParams.toString()}`);
    }
  };

  const handleServiceSelect = (selectedService: ServiceSuggestion) => {
    setService(selectedService.name);
    setServiceFocused(false);
    locationInputRef.current?.focus();
  };

  const handleLocationSelect = (selectedLocation: LocationSuggestion) => {
    setLocation(selectedLocation.name);
    setLocationFocused(false);
  };


  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4 p-4 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
        {/* Service Input */}
        <div className="flex-1 relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Service
          </label>
          <div className="relative">
            <input
              ref={serviceInputRef}
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              onFocus={() => setServiceFocused(true)}
              placeholder="TRT, ED treatment, Hair loss..."
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Service Dropdown */}
          {serviceFocused && filteredServices.length > 0 && (
            <div 
              ref={serviceDropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
            >
              {filteredServices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleServiceSelect(item)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 flex flex-col"
                >
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-gray-400 text-sm">{item.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location Input */}
        <div className="flex-1 relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Location
          </label>
          <div className="relative">
            <input
              ref={locationInputRef}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setLocationFocused(true)}
              placeholder="City, State or ZIP"
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          {/* Location Dropdown */}
          {locationFocused && filteredLocations.length > 0 && (
            <div 
              ref={locationDropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
            >
              {filteredLocations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLocationSelect(item)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center justify-between"
                >
                  <span className="text-white">{item.name}</span>
                  <span className="text-gray-400 text-xs uppercase">{item.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            type="submit"
            className="px-8 py-3 bg-primary hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap h-[52px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MapSearchBar;