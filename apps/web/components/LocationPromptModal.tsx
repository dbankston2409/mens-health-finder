import React, { useState, useEffect } from 'react';
import { getUserLocation, reverseGeocode, saveUserLocation } from '../utils/geoUtils';

interface LocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationAccepted: (location: { lat: number; lng: number; city?: string; state?: string }) => void;
  onLocationDenied: () => void;
}

const LocationPromptModal: React.FC<LocationPromptModalProps> = ({
  isOpen,
  onClose,
  onLocationAccepted,
  onLocationDenied
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualZip, setManualZip] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    // Check if we've already asked for location permission
    const hasAskedForLocation = localStorage.getItem('hasAskedForLocation');
    if (hasAskedForLocation && !isOpen) {
      return;
    }

    // Mark that we've shown the prompt
    if (isOpen) {
      localStorage.setItem('hasAskedForLocation', 'true');
    }
  }, [isOpen]);

  const requestLocation = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Get user location using our utility function
      const coords = await getUserLocation();
      
      if (!coords) {
        setError('Geolocation is not supported or was denied by your browser');
        setIsRequesting(false);
        setShowManualInput(true);
        return;
      }

      // Store coordinates in session storage
      sessionStorage.setItem('userLocation', JSON.stringify({
        ...coords,
        timestamp: Date.now()
      }));

      // Try to reverse geocode to get city and state
      let locationData: { lat: number; lng: number; city?: string; state?: string } = coords;

      try {
        // Use our utility function for reverse geocoding
        const locationInfo = await reverseGeocode(coords.lat, coords.lng);
        
        if (locationInfo) {
          locationData = { 
            ...coords, 
            city: locationInfo.city, 
            state: locationInfo.state 
          };
          
          // Save the full location data
          saveUserLocation(locationData);
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        // Continue with just lat/lng
      }

      onLocationAccepted(locationData);
      onClose();
    } catch (error: any) {
      console.error('Location request failed:', error);
      
      let errorMessage = 'Failed to get your location';
      if (error.code === 1) {
        errorMessage = 'Location access denied. You can manually enter your ZIP code below.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. You can manually enter your ZIP code below.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timeout. You can manually enter your ZIP code below.';
      }
      
      setError(errorMessage);
      setShowManualInput(true);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualZip.trim()) return;

    setIsRequesting(true);
    setError(null);

    try {
      // Geocode the ZIP code
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${manualZip}&countrycodes=us&limit=1`,
        { headers: { 'User-Agent': 'MensHealthFinder/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          const locationData = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            city: result.display_name.split(',')[0],
            state: 'US' // We'll get the proper state from the display_name if needed
          };

          // Store in session storage
          sessionStorage.setItem('userLocation', JSON.stringify({
            ...locationData,
            timestamp: Date.now()
          }));

          onLocationAccepted(locationData);
          onClose();
        } else {
          setError('ZIP code not found. Please try a different ZIP code.');
        }
      } else {
        setError('Failed to look up ZIP code. Please try again.');
      }
    } catch (error) {
      console.error('ZIP code lookup failed:', error);
      setError('Failed to look up ZIP code. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    localStorage.setItem('locationPermissionDenied', 'true');
    onLocationDenied();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Find Clinics Near You
          </h2>
          <p className="text-gray-400 text-sm">
            Allow location access to show results near you and get personalized recommendations.
          </p>
        </div>

        {!showManualInput ? (
          <div className="space-y-4">
            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">See clinics within driving distance</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">Get accurate driving directions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">Sorted by distance from you</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={requestLocation}
                disabled={isRequesting}
                className="w-full px-4 py-3 bg-primary hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Getting Location...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Allow Location Access</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowManualInput(true)}
                className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Enter ZIP code instead
              </button>

              <button
                onClick={handleDeny}
                className="w-full px-4 py-2 text-gray-500 hover:text-gray-400 transition-colors text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter your ZIP code
              </label>
              <input
                type="text"
                value={manualZip}
                onChange={(e) => setManualZip(e.target.value)}
                placeholder="12345"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                maxLength={5}
                pattern="[0-9]{5}"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isRequesting || !manualZip.trim()}
                className="w-full px-4 py-3 bg-primary hover:bg-red-600 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                {isRequesting ? 'Looking up...' : 'Find Clinics'}
              </button>

              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to location request
              </button>
            </div>
          </form>
        )}

        {/* Privacy notice */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Your location is only used to show nearby clinics and is not stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPromptModal;