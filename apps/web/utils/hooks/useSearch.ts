import { useState, useEffect, useCallback } from 'react';
import { searchClinics, getSearchSuggestions, getNearbyClinics } from '../../lib/search';
import { ClinicFilter, ExtendedClinic } from '../../types';
import { DocumentData } from 'firebase/firestore';
import { getUserLocation, reverseGeocode, saveUserLocation } from '../geoUtils';

interface UseSearchProps {
  initialFilters?: ClinicFilter;
  pageSize?: number;
  enableAutoLocation?: boolean;
}

interface UseSearchResult {
  results: ExtendedClinic[];
  loading: boolean;
  error: string | null;
  filters: ClinicFilter;
  setFilters: (filters: ClinicFilter) => void;
  updateFilter: <K extends keyof ClinicFilter>(key: K, value: ClinicFilter[K]) => void;
  clearFilters: () => void;
  userLocation: { lat: number; lng: number; city?: string; state?: string } | null;
  detectUserLocation: () => Promise<boolean>;
  suggestions: {
    clinics: { id: string; name: string; city: string; state: string }[];
    services: string[];
    locations: { city: string; state: string }[];
  };
  suggestionsLoading: boolean;
  getSuggestions: (query: string) => Promise<void>;
  loadMore: () => Promise<boolean>;
  hasMore: boolean;
}

/**
 * Custom hook for enhanced search functionality
 */
export function useSearch({
  initialFilters = {},
  pageSize = 20,
  enableAutoLocation = true
}: UseSearchProps = {}): UseSearchResult {
  // State for search results and pagination
  const [results, setResults] = useState<ExtendedClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClinicFilter>(initialFilters);
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // State for user location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  
  // State for search suggestions
  const [suggestions, setSuggestions] = useState<{
    clinics: { id: string; name: string; city: string; state: string }[];
    services: string[];
    locations: { city: string; state: string }[];
  }>({
    clinics: [],
    services: [],
    locations: []
  });
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  
  /**
   * Search function
   */
  const performSearch = useCallback(async (reset: boolean = true) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use lastDoc for pagination, or null for a fresh search
      const doc = reset ? null : lastDoc;
      
      const { clinics, lastDoc: newLastDoc, hasMore: newHasMore } = await searchClinics(
        filters,
        pageSize,
        doc
      );
      
      // Update results
      if (reset) {
        setResults(clinics);
      } else {
        setResults(prev => [...prev, ...clinics]);
      }
      
      // Update pagination state
      setLastDoc(newLastDoc);
      setHasMore(newHasMore);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, lastDoc, pageSize]);
  
  /**
   * Load more results for pagination
   */
  const loadMore = async (): Promise<boolean> => {
    if (!hasMore || loading) return false;
    
    await performSearch(false);
    return true;
  };
  
  /**
   * Update a single filter
   */
  const updateFilter = useCallback(<K extends keyof ClinicFilter>(
    key: K,
    value: ClinicFilter[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  /**
   * Get search suggestions based on user input
   */
  const getSuggestions = async (query: string): Promise<void> => {
    if (!query || query.length < 2) {
      setSuggestions({ clinics: [], services: [], locations: [] });
      return;
    }
    
    setSuggestionsLoading(true);
    
    try {
      const results = await getSearchSuggestions(query);
      setSuggestions(results);
    } catch (err) {
      console.error('Error getting suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };
  
  /**
   * Detect user's location
   */
  const detectUserLocation = async (): Promise<boolean> => {
    try {
      // Try to get coordinates
      const coords = await getUserLocation();
      
      if (!coords) {
        return false;
      }
      
      // Get city and state from coordinates
      const locationInfo = await reverseGeocode(coords.lat, coords.lng);
      
      if (locationInfo) {
        const fullLocation = {
          ...coords,
          city: locationInfo.city,
          state: locationInfo.state
        };
        
        // Save location to storage
        saveUserLocation(fullLocation);
        
        // Update state
        setUserLocation(fullLocation);
        
        // Update filters with coordinates
        setFilters(prev => ({
          ...prev,
          lat: coords.lat,
          lng: coords.lng,
          radius: 50 // Default radius of 50 miles
        }));
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error detecting location:', err);
      return false;
    }
  };
  
  // Perform initial search when filters change
  useEffect(() => {
    performSearch();
  }, [performSearch]);
  
  // Try to get user location on initial load if enabled
  useEffect(() => {
    if (enableAutoLocation) {
      // Check if we have permission from previous session
      const hasPermission = localStorage.getItem('hasLocationPermission') === 'true';
      
      if (hasPermission) {
        detectUserLocation();
      }
    }
  }, [enableAutoLocation]);
  
  return {
    results,
    loading,
    error,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    userLocation,
    detectUserLocation,
    suggestions,
    suggestionsLoading,
    getSuggestions,
    loadMore,
    hasMore
  };
}

export default useSearch;