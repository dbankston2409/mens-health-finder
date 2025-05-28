import { useState, useEffect, useMemo } from 'react';

interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  services: string[];
  tier: 'free' | 'low' | 'high';
  phone?: string;
  website?: string;
  rating?: number;
}

interface ClinicWithDistance extends Clinic {
  distance: number;
}

interface UseGeoSearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // in miles, default 50
  serviceFilter?: string;
  tierFilter?: string[];
  includeInactive?: boolean;
}

interface UseGeoSearchResult {
  clinics: ClinicWithDistance[];
  loading: boolean;
  error: string | null;
  totalWithinRadius: number;
  refresh: () => void;
}

// Haversine formula to calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
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

// Mock data for demonstration - in production this would come from Firebase
const mockClinics: Clinic[] = [
  {
    id: '1',
    name: 'Prime Men\'s Health',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    lat: 30.2672,
    lng: -97.7431,
    services: ['TRT', 'ED Treatment', 'Weight Loss'],
    tier: 'high',
    phone: '(512) 555-0101',
    rating: 4.8
  },
  {
    id: '2',
    name: 'Elite Men\'s Clinic',
    address: '456 Oak Ave',
    city: 'Dallas',
    state: 'TX',
    lat: 32.7767,
    lng: -96.7970,
    services: ['TRT', 'Hair Loss', 'ED Treatment'],
    tier: 'high',
    phone: '(214) 555-0102',
    rating: 4.7
  },
  {
    id: '3',
    name: 'Men\'s Wellness Center',
    address: '789 Pine St',
    city: 'Houston',
    state: 'TX',
    lat: 29.7604,
    lng: -95.3698,
    services: ['TRT', 'Peptide Therapy'],
    tier: 'low',
    phone: '(713) 555-0103',
    rating: 4.3
  },
  {
    id: '4',
    name: 'Superior Men\'s Clinic',
    address: '321 Cedar Rd',
    city: 'San Antonio',
    state: 'TX',
    lat: 29.4241,
    lng: -98.4936,
    services: ['TRT', 'ED Treatment', 'Weight Loss', 'Hair Loss'],
    tier: 'high',
    phone: '(210) 555-0104',
    rating: 4.6
  },
  {
    id: '5',
    name: 'Lone Star Men\'s Health',
    address: '654 Elm Way',
    city: 'Fort Worth',
    state: 'TX',
    lat: 32.7555,
    lng: -97.3308,
    services: ['TRT', 'Wellness'],
    tier: 'free',
    phone: '(817) 555-0105',
    rating: 4.1
  },
  {
    id: '6',
    name: 'California Men\'s Institute',
    address: '987 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    lat: 34.0522,
    lng: -118.2437,
    services: ['TRT', 'ED Treatment', 'Hair Loss', 'IV Therapy'],
    tier: 'high',
    phone: '(213) 555-0106',
    rating: 4.9
  },
  {
    id: '7',
    name: 'Mile High Men\'s Health',
    address: '147 Mountain View Dr',
    city: 'Denver',
    state: 'CO',
    lat: 39.7392,
    lng: -104.9903,
    services: ['TRT', 'Peptide Therapy', 'Cryotherapy'],
    tier: 'low',
    phone: '(303) 555-0107',
    rating: 4.4
  }
];

export const useGeoSearch = ({
  latitude,
  longitude,
  radius = 50,
  serviceFilter,
  tierFilter,
  includeInactive = false
}: UseGeoSearchParams): UseGeoSearchResult => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate API call to fetch clinics
  const fetchClinics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, this would be a Firestore query:
      // const clinicsRef = collection(db, 'clinics');
      // const q = query(clinicsRef, where('status', '==', 'active'));
      // const snapshot = await getDocs(q);
      // const clinics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setClinics(mockClinics);
    } catch (err) {
      setError('Failed to fetch clinics');
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchClinics();
  }, []);

  // Process clinics with distance calculation and filtering
  const processedClinics = useMemo(() => {
    if (!clinics.length) return [];

    // Calculate distance for each clinic
    const clinicsWithDistance: ClinicWithDistance[] = clinics.map(clinic => ({
      ...clinic,
      distance: calculateDistance(latitude, longitude, clinic.lat, clinic.lng)
    }));

    // Filter by radius
    let filtered = clinicsWithDistance.filter(clinic => clinic.distance <= radius);

    // Filter by service if specified
    if (serviceFilter) {
      filtered = filtered.filter(clinic =>
        clinic.services.some(service =>
          service.toLowerCase().includes(serviceFilter.toLowerCase())
        )
      );
    }

    // Filter by tier if specified
    if (tierFilter && tierFilter.length > 0) {
      filtered = filtered.filter(clinic =>
        tierFilter.includes(clinic.tier)
      );
    }

    // Sort by distance (closest first)
    filtered.sort((a, b) => a.distance - b.distance);

    return filtered;
  }, [clinics, latitude, longitude, radius, serviceFilter, tierFilter]);

  const totalWithinRadius = useMemo(() => {
    return clinics.filter(clinic => 
      calculateDistance(latitude, longitude, clinic.lat, clinic.lng) <= radius
    ).length;
  }, [clinics, latitude, longitude, radius]);

  const refresh = () => {
    fetchClinics();
  };

  return {
    clinics: processedClinics,
    loading,
    error,
    totalWithinRadius,
    refresh
  };
};

// Helper hook for getting user's current location
export const useUserLocation = () => {
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Failed to get your location';
        if (error.code === 1) {
          errorMessage = 'Location access denied';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable';
        } else if (error.code === 3) {
          errorMessage = 'Location request timeout';
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation
  };
};

export default useGeoSearch;