import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

  // Fetch clinics from Firebase
  const fetchClinics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Query Firestore for clinics
      const clinicsRef = collection(db, 'clinics');
      let q = query(clinicsRef, where('status', '==', 'active'));
      
      // Add additional filters if needed
      if (!includeInactive) {
        q = query(clinicsRef, where('status', '==', 'active'), orderBy('name'));
      }
      
      const snapshot = await getDocs(q);
      const fetchedClinics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Clinic[];
      
      setClinics(fetchedClinics);
    } catch (err) {
      setError('Failed to fetch clinics');
      console.error('Error fetching clinics:', err);
      setClinics([]); // Set empty array on error
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
    const clinicsWithDistance = clinics.map(clinic => ({
      ...clinic,
      distance: calculateDistance(latitude, longitude, clinic.lat, clinic.lng)
    }));
    
    // Filter by radius
    let filtered = clinicsWithDistance.filter(clinic => clinic.distance <= radius);
    
    // Filter by service
    if (serviceFilter) {
      filtered = filtered.filter(clinic => 
        clinic.services.some(service => 
          service.toLowerCase().includes(serviceFilter.toLowerCase())
        )
      );
    }
    
    // Filter by tier
    if (tierFilter && tierFilter.length > 0) {
      filtered = filtered.filter(clinic => 
        tierFilter.includes(clinic.tier)
      );
    }
    
    // Sort by distance
    return filtered.sort((a, b) => a.distance - b.distance);
  }, [clinics, latitude, longitude, radius, serviceFilter, tierFilter]);

  return {
    clinics: processedClinics,
    loading,
    error,
    totalWithinRadius: processedClinics.length,
    refresh: fetchClinics
  };
};

// Hook to get the user's current location
export const useUserLocation = () => {
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
  }, []);

  return { location, loading, error };
};

export default useGeoSearch;