import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TierBadge from './TierBadge';

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
        
        // In development, provide fallback data
        if (process.env.NODE_ENV === 'development') {
          setClinics([
            {
              id: 'mock1',
              name: 'Austin Men\'s Health Center',
              slug: 'austin-mens-health-center',
              city: 'Austin',
              state: 'TX',
              services: ['TRT', 'ED Treatment', 'Weight Management'],
              tier: 'premium',
              validationStatus: { verified: true }
            },
            {
              id: 'mock2',
              name: 'Elite Men\'s Clinic',
              slug: 'elite-mens-clinic',
              city: 'Dallas',
              state: 'TX',
              services: ['TRT', 'Hormone Therapy'],
              tier: 'featured',
              validationStatus: { verified: true }
            },
            {
              id: 'mock3',
              name: 'Total Men\'s Health',
              slug: 'total-mens-health',
              city: 'Houston',
              state: 'TX',
              services: ['TRT', 'ED Treatment', 'Hair Loss'],
              tier: 'advanced',
              validationStatus: { verified: true }
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedClinics();
  }, []);

  // Show skeleton loader while fetching
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[...Array(6)].map((_, index) => (
          <div key={`skeleton-${index}`} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
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
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full"
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
              <TierBadge tier={clinic.tier} />
            </div>
          </div>
          
          <div className="p-4 flex-grow">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{clinic.name}</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-2">{clinic.city}, {clinic.state}</p>
            
            <div className="mt-2">
              {clinic.services && clinic.services.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {clinic.services.slice(0, 3).map((service, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {service}
                    </span>
                  ))}
                  {clinic.services.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
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
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300">
              View Clinic
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FeaturedClinics;