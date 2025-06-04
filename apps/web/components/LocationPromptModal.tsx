import React, { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAcceptLocation = async () => {
    setIsLoading(true);
    localStorage.setItem('hasAskedForLocation', 'true');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      
      // Store in session storage
      sessionStorage.setItem('userLocation', JSON.stringify({ lat, lng }));
      
      // Try to get city/state from coordinates
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'User-Agent': 'MensHealthFinder/1.0' } }
        );
        
        if (response.ok) {
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village;
          const state = data.address?.state;
          
          onLocationAccepted({ lat, lng, city, state });
        } else {
          onLocationAccepted({ lat, lng });
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        onLocationAccepted({ lat, lng });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      handleDenyLocation();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleDenyLocation = () => {
    localStorage.setItem('hasAskedForLocation', 'true');
    localStorage.setItem('locationPermissionDenied', 'true');
    onLocationDenied();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">
          Enable Location for Better Results
        </h2>
        
        <p className="text-gray-300 mb-6">
          Allow access to your location to see clinics near you and get distance information.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleAcceptLocation}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Getting Location...' : 'Allow Location'}
          </button>
          
          <button
            onClick={handleDenyLocation}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPromptModal;