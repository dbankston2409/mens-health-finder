import React, { useRef, useEffect, useState } from 'react';
import { ExtendedClinic } from '../types';
import ClinicCard from './ClinicCard';

interface LazySearchResultsProps {
  results: ExtendedClinic[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<boolean>;
  showDistance?: boolean;
  emptyMessage?: string;
}

const LazySearchResults: React.FC<LazySearchResultsProps> = ({
  results,
  loading,
  hasMore,
  onLoadMore,
  showDistance = false,
  emptyMessage = 'No clinics found matching your search criteria.'
}) => {
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const currentLoaderRef = loaderRef.current;
    
    if (!currentLoaderRef || loading || !hasMore) return;
    
    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          
          try {
            await onLoadMore();
          } finally {
            setLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(currentLoaderRef);
    
    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, loading, loadingMore, onLoadMore]);
  
  // Convert clinic data for ClinicCard
  const formatClinicForCard = (clinic: ExtendedClinic) => {
    return {
      id: clinic.id || '',
      name: clinic.name,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      services: clinic.services || [],
      tier: clinic.tier,
      phone: clinic.phone,
      website: clinic.website,
      rating: clinic.rating,
      distance: clinic.distance,
      verified: clinic.verified
    };
  };
  
  // Empty state
  if (!loading && results.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
        <p className="text-gray-400 mb-4">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Results */}
      {results.map((clinic) => (
        <ClinicCard
          key={clinic.id}
          clinic={formatClinicForCard(clinic)}
          showDistance={showDistance}
        />
      ))}
      
      {/* Loading state */}
      {(loading || loadingMore) && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-400">Loading more clinics...</p>
        </div>
      )}
      
      {/* Invisible loader for intersection observer */}
      {hasMore && !loading && !loadingMore && (
        <div ref={loaderRef} className="h-4" />
      )}
      
      {/* End of results message */}
      {!hasMore && results.length > 0 && (
        <div className="py-6 text-center">
          <p className="text-gray-400 text-sm">
            You've reached the end of the results
          </p>
        </div>
      )}
    </div>
  );
};

export default LazySearchResults;