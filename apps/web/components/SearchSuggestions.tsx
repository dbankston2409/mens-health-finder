import React from 'react';

interface SearchSuggestionsProps {
  suggestions: {
    clinics: { id: string; name: string; city: string; state: string }[];
    services: string[];
    locations: { city: string; state: string }[];
  };
  loading: boolean;
  onSelectClinic: (clinic: { id: string; name: string; city: string; state: string }) => void;
  onSelectService: (service: string) => void;
  onSelectLocation: (location: { city: string; state: string }) => void;
  isVisible: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  loading,
  onSelectClinic,
  onSelectService,
  onSelectLocation,
  isVisible
}) => {
  if (!isVisible) return null;
  
  const { clinics, services, locations } = suggestions;
  const hasResults = clinics.length > 0 || services.length > 0 || locations.length > 0;
  
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading suggestions...</p>
        </div>
      ) : !hasResults ? (
        <div className="p-4 text-center text-gray-400 text-sm">
          No suggestions found. Try a different search term.
        </div>
      ) : (
        <div className="p-2">
          {/* Clinics */}
          {clinics.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs uppercase text-gray-500 font-semibold px-3 py-2">Clinics</h3>
              <div className="space-y-1">
                {clinics.map((clinic) => (
                  <button
                    key={clinic.id}
                    onClick={() => onSelectClinic(clinic)}
                    className="w-full flex flex-col px-3 py-2 rounded-lg text-left hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-white font-medium">{clinic.name}</span>
                    <span className="text-gray-400 text-sm">{clinic.city}, {clinic.state}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Services */}
          {services.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs uppercase text-gray-500 font-semibold px-3 py-2">Services</h3>
              <div className="space-y-1">
                {services.map((service) => (
                  <button
                    key={service}
                    onClick={() => onSelectService(service)}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-left hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-white">{service}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Locations */}
          {locations.length > 0 && (
            <div>
              <h3 className="text-xs uppercase text-gray-500 font-semibold px-3 py-2">Locations</h3>
              <div className="space-y-1">
                {locations.map((location, index) => (
                  <button
                    key={`${location.city}-${location.state}-${index}`}
                    onClick={() => onSelectLocation(location)}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-left hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white">{location.city}, {location.state}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;