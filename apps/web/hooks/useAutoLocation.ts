import { useState, useEffect } from 'react';

export interface AutoLocation {
  city: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
  country?: string;
  isDefault?: boolean;
}

interface UseAutoLocationReturn {
  location: AutoLocation | null;
  isLoading: boolean;
  error: string | null;
  setLocation: (location: AutoLocation) => void;
  clearLocation: () => void;
}

export function useAutoLocation(): UseAutoLocationReturn {
  const [location, setLocation] = useState<AutoLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check sessionStorage first for saved location
    const storedLocation = sessionStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        setLocation(JSON.parse(storedLocation));
        setIsLoading(false);
        return;
      } catch (e) {
        // Invalid stored data, continue with detection
        sessionStorage.removeItem('userLocation');
      }
    }

    // Detect location from IP
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/detect-location');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // Non-US user
          setError(data.error || 'Service only available in the US');
        } else {
          // Other error, use fallback
          setLocation({
            city: 'Dallas',
            state: 'Texas',
            stateCode: 'TX',
            lat: 32.7767,
            lng: -96.7970,
            isDefault: true
          });
        }
      } else if (data.city) {
        setLocation(data);
        sessionStorage.setItem('userLocation', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Location detection failed:', err);
      // Use fallback location
      setLocation({
        city: 'Dallas',
        state: 'Texas',
        stateCode: 'TX',
        lat: 32.7767,
        lng: -96.7970,
        isDefault: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = (newLocation: AutoLocation) => {
    setLocation(newLocation);
    sessionStorage.setItem('userLocation', JSON.stringify(newLocation));
    setError(null);
  };

  const clearLocation = () => {
    setLocation(null);
    sessionStorage.removeItem('userLocation');
    setError(null);
  };

  return {
    location,
    isLoading,
    error,
    setLocation: updateLocation,
    clearLocation
  };
}