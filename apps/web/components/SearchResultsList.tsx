import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TierBadge from './TierBadge';
import { convertTierToEnum } from '../lib/utils';
import { Clinic, ClinicFilter } from '../types';
import { queryClinics } from '../lib/api/clinicService';
import TrackedPhoneLink from './TrackedPhoneLink';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';

interface SearchResultsListProps {
  initialFilters: ClinicFilter;
  userLocation?: { lat: number; lng: number } | null;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({ initialFilters, userLocation }) => {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [filters, setFilters] = useState<ClinicFilter>(initialFilters);
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'rating'>('relevance');
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  // Update filters when initialFilters change
  useEffect(() => {
    setFilters(initialFilters);
    setClinics([]); // Reset results
    setLastDoc(null); // Reset pagination
    setHasMore(true); // Reset hasMore flag
    setLoading(true); // Set loading state
  }, [initialFilters]);

  // Fetch clinics when filters or lastDoc change
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setError(null);
        
        // Don't fetch if there are no filters
        if (Object.keys(filters).length === 0) {
          setLoading(false);
          return;
        }
        
        const result = await queryClinics(filters, PAGE_SIZE, lastDoc || undefined);
        
        // If this is a new search (lastDoc is null), replace the current results
        // Otherwise, append the new results
        if (!lastDoc) {
          setClinics(result.clinics);
        } else {
          setClinics(prevClinics => [...prevClinics, ...result.clinics]);
        }
        
        setHasMore(result.hasMore);
        setLastDoc(result.lastDoc || null);
      } catch (err) {
        console.error('Error fetching clinics:', err);
        setError('Failed to load clinics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we're loading and it's either the initial load or there are more results
    if (loading && (hasMore || !lastDoc)) {
      fetchClinics();
    }
  }, [filters, loading, lastDoc, hasMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          // Load more results when the sentinel element is visible
          setLoading(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading]);

  // Sort clinics based on the selected sort method
  const sortedClinics = React.useMemo(() => {
    if (!clinics.length) return [];
    
    let sorted = [...clinics];
    
    if (sortBy === 'distance' && userLocation) {
      // Sort by distance if we have user location
      sorted.sort((a, b) => {
        // If either clinic is missing coordinates, put it at the end
        if (!a.lat || !a.lng) return 1;
        if (!b.lat || !b.lng) return -1;
        
        // Calculate distances
        const distA = calculateDistance(
          userLocation.lat, userLocation.lng, 
          a.lat, a.lng
        );
        const distB = calculateDistance(
          userLocation.lat, userLocation.lng, 
          b.lat, b.lng
        );
        
        return distA - distB;
      });
    } else if (sortBy === 'rating') {
      // Sort by rating
      sorted.sort((a, b) => {
        // Use ratings from reviewStats if available, otherwise use regular rating, or default to 0
        const ratingA = a.reviewStats?.averageRating || a.rating || 0;
        const ratingB = b.reviewStats?.averageRating || b.rating || 0;
        return ratingB - ratingA; // Higher ratings first
      });
    } else {
      // Default sort - by relevance (advanced first, then standard, then free)
      sorted.sort((a, b) => {
        // Sort by tier/package first
        const tierOrder: { [key: string]: number } = { 
          'advanced': 0,
          'high': 0, // Legacy value
          'premium': 0, // Legacy value
          'standard': 1,
          'low': 1, // Legacy value
          'basic': 1, // Legacy value
          'free': 2
        };
        
        const aTier = a.tier || a.package || 'free';
        const bTier = b.tier || b.package || 'free';
        
        const tierDiff = (tierOrder[aTier.toLowerCase()] || 2) - (tierOrder[bTier.toLowerCase()] || 2);
        
        if (tierDiff !== 0) return tierDiff;
        
        // If tiers are the same, sort by traffic/popularity
        const aClicks = a.trafficMeta?.totalClicks || 0;
        const bClicks = b.trafficMeta?.totalClicks || 0;
        
        return bClicks - aClicks;
      });
    }
    
    return sorted;
  }, [clinics, sortBy, userLocation]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Implementation of haversine formula to calculate distance
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Render loading state
  if (loading && clinics.length === 0) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={`skeleton-${i}`} className="card p-6 border-l-4 border-gray-600 animate-pulse">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-3/4">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-700 rounded-full w-20"></div>
                  <div className="h-5 bg-gray-700 rounded-full w-20"></div>
                  <div className="h-5 bg-gray-700 rounded-full w-20"></div>
                </div>
              </div>
              <div className="md:w-1/4">
                <div className="h-10 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-10 bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render error state
  if (error && clinics.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => router.reload()} 
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render no results state
  if (!loading && clinics.length === 0 && Object.keys(filters).length > 0) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4">No clinics found matching your search criteria.</p>
        <button 
          onClick={() => router.push('/search')} 
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md"
        >
          Reset Search
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Sorting controls */}
      {clinics.length > 0 && (
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {clinics.length} {clinics.length === 1 ? 'clinic' : 'clinics'}
          </div>
          
          <div className="flex items-center">
            <span className="text-sm mr-2 text-gray-400">Sort by:</span>
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button
                className={`px-3 py-1.5 text-sm ${sortBy === 'relevance' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                onClick={() => setSortBy('relevance')}
              >
                Relevance
              </button>
              <button
                className={`px-3 py-1.5 text-sm ${sortBy === 'distance' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                onClick={() => setSortBy('distance')}
                disabled={!userLocation}
                title={!userLocation ? 'Enable location to sort by distance' : ''}
              >
                Distance
              </button>
              <button
                className={`px-3 py-1.5 text-sm ${sortBy === 'rating' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                onClick={() => setSortBy('rating')}
              >
                Rating
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Results list */}
      <div className="space-y-6">
        {sortedClinics.map((clinic) => {
          const tier = clinic.tier || clinic.package || 'free';
          
          // Calculate distance if user location is available
          let distanceText = '';
          if (userLocation && clinic.lat && clinic.lng) {
            const distance = calculateDistance(
              userLocation.lat, userLocation.lng,
              clinic.lat, clinic.lng
            );
            distanceText = `${distance.toFixed(1)} miles away`;
          }
          
          return (
            <div 
              key={clinic.id} 
              className={`card p-6 border-l-4 ${
                tier === 'advanced' || tier === 'premium' || tier === 'high' ? 'border-primary' : 
                tier === 'standard' || tier === 'basic' || tier === 'low' ? 'border-yellow-500' : 
                'border-gray-600'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-3/4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <Link 
                        href={`/clinic/${clinic.slug || clinic.id}`}
                        className="text-xl font-bold hover:text-primary transition-colors"
                      >
                        {clinic.name}
                      </Link>
                      <div className="flex items-center flex-wrap gap-2">
                        <p className="text-gray-400">{clinic.city}, {clinic.state}</p>
                        {distanceText && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                            {distanceText}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <TierBadge tier={convertTierToEnum(tier)} />
                      
                      {clinic.validationStatus?.verified && (
                        <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-2">{clinic.address}</p>
                  {clinic.phone && (
                    <p className="text-sm text-gray-400 mb-4">
                      <TrackedPhoneLink 
                        phone={clinic.phone} 
                        clinicId={clinic.id || ''} 
                        className="hover:text-primary transition-colors" 
                      />
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(clinic.services || []).map((service) => (
                      <span 
                        key={service} 
                        className="bg-gray-800 text-xs px-3 py-1 rounded-full hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => {
                          router.push({
                            pathname: '/search',
                            query: { ...router.query, service }
                          });
                        }}
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="md:w-1/4 flex flex-col justify-between gap-4">
                  <Link 
                    href={`/clinic/${clinic.slug || clinic.id}`}
                    className="btn text-center"
                  >
                    View Profile
                  </Link>
                  
                  {(tier === 'advanced' || tier === 'premium' || tier === 'high') && (
                    <Link 
                      href={`/clinic/${clinic.slug || clinic.id}#book`}
                      className="btn bg-green-600 hover:bg-green-700 text-center"
                    >
                      Book Appointment
                    </Link>
                  )}
                  
                  {clinic.website && (tier !== 'free') && (
                    <a 
                      href={clinic.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-center text-gray-400 hover:text-primary transition-colors"
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Loading more indicator */}
        {loading && clinics.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading more clinics...</p>
          </div>
        )}
        
        {/* Sentinel element for infinite scrolling */}
        {hasMore && (
          <div ref={observerTarget} className="h-10 w-full" />
        )}
        
        {/* End of results message */}
        {!hasMore && clinics.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            No more clinics to display
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResultsList;