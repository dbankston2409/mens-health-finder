import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TierBadge from './TierBadge';
import { convertTierToEnum } from '../lib/utils';

interface FeaturedClinic {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  services: string[];
  tier: string;
  imageUrl?: string;
  package?: string; // For backward compatibility
  validationStatus: {
    verified: boolean;
    [key: string]: any;
  };
}

const FeaturedClinics: React.FC = () => {
  const [clinics, setClinics] = useState<FeaturedClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedClinics = async () => {
      try {
        setLoading(true);
        
        // Query Firestore for featured clinics
        const featuredQuery = query(
          collection(db, 'clinics'),
          where('featured', '==', true),
          where('status', '==', 'active'),
          orderBy('lastUpdated', 'desc'),
          limit(6)
        );
        
        const snapshot = await getDocs(featuredQuery);
        
        if (snapshot.empty) {
          // Fallback to premium tier clinics if no featured ones
          const premiumQuery = query(
            collection(db, 'clinics'),
            where('tier', 'in', ['premium', 'advanced', 'featured']),
            where('status', '==', 'active'),
            orderBy('lastUpdated', 'desc'),
            limit(6)
          );
          
          const premiumSnapshot = await getDocs(premiumQuery);
          
          if (premiumSnapshot.empty) {
            // Further fallback to any active clinics
            const activeQuery = query(
              collection(db, 'clinics'),
              where('status', '==', 'active'),
              orderBy('lastUpdated', 'desc'),
              limit(6)
            );
            
            const activeSnapshot = await getDocs(activeQuery);
            
            if (activeSnapshot.empty) {
              setError('No clinics found');
              setClinics([]);
            } else {
              const clinicsData = activeSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                tier: doc.data().package || doc.data().tier || 'basic'
              })) as FeaturedClinic[];
              setClinics(clinicsData);
            }
          } else {
            const clinicsData = premiumSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              tier: doc.data().package || doc.data().tier || 'basic'
            })) as FeaturedClinic[];
            setClinics(clinicsData);
          }
        } else {
          const clinicsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            tier: doc.data().package || doc.data().tier || 'basic'
          })) as FeaturedClinic[];
          setClinics(clinicsData);
        }
      } catch (err) {
        console.error('Error fetching featured clinics:', err);
        setError('Failed to load featured clinics');
        
        // No fallback data - show empty state
        setClinics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedClinics();
  }, []);

  // Show skeleton loader while fetching
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <div key={`skeleton-${index}`} className="card p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-gray-700 rounded mb-4"></div>
            <div className="h-10 bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show error message
  if (error && clinics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <p className="mt-2">Please try again later or browse all clinics.</p>
      </div>
    );
  }

  // Show featured clinics
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {clinics.map(clinic => (
        <Link 
          href={`/clinic/${clinic.slug}`}
          key={clinic.id}
          className="card hover:bg-[#1a1a1a] transition-all flex flex-col h-full"
        >
          <div className="relative h-48 w-full bg-gray-200">
            {clinic.imageUrl ? (
              <Image 
                src={clinic.imageUrl} 
                alt={clinic.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Image 
                  src="/images/logos/mens-health-finder-placeholder.png"
                  alt="Clinic"
                  width={150}
                  height={100}
                  className="object-contain opacity-40"
                />
              </div>
            )}
            {/* Show tier badge */}
            <div className="absolute top-2 right-2">
              <TierBadge tier={convertTierToEnum(clinic.tier)} />
            </div>
          </div>
          
          <div className="p-4 flex-grow">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-white mb-1">{clinic.name}</h3>
            </div>
            
            <p className="text-[#AAAAAA] text-sm mb-2">{clinic.city}, {clinic.state}</p>
            
            <div className="mt-2">
              {clinic.services && clinic.services.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {clinic.services.slice(0, 3).map((service, index) => (
                    <span key={index} className="bg-gray-800 text-xs px-3 py-1 rounded-full">
                      {service}
                    </span>
                  ))}
                  {clinic.services.length > 3 && (
                    <span className="bg-gray-800 text-xs px-3 py-1 rounded-full">
                      +{clinic.services.length - 3}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Services information unavailable</p>
              )}
            </div>
          </div>
          
          <div className="px-4 pb-4">
            <span className="btn w-full text-center">
              View Clinic
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FeaturedClinics;